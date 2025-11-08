import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from WebSocket subprotocol
    const protocol = req.headers.get('sec-websocket-protocol');
    let token = '';
    
    if (protocol) {
      const protocols = protocol.split(',').map(p => p.trim());
      const authIndex = protocols.indexOf('auth');
      if (authIndex !== -1 && protocols.length > authIndex + 1) {
        token = protocols[authIndex + 1];
      }
    }

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { headers } = req;
    const upgradeHeader = headers.get("upgrade") || "";

    if (upgradeHeader.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket connection", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const DEEPGRAM_API_KEY = Deno.env.get("DEEPGRAM_API_KEY");
    if (!DEEPGRAM_API_KEY) {
      console.error("DEEPGRAM_API_KEY is not configured");
      return new Response("DEEPGRAM_API_KEY is not configured", { 
        status: 500,
        headers: corsHeaders 
      });
    }

    console.log("Upgrading to WebSocket connection for user:", user.id);
    const { socket, response } = Deno.upgradeWebSocket(req, {
      protocol: 'auth'
    });

    // Connect to Deepgram's streaming API with opus encoding
    const deepgramUrl = "wss://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&interim_results=true&encoding=opus";
    
    console.log("Connecting to Deepgram API");
    // Authenticate using Sec-WebSocket-Protocol header
    const deepgramSocket = new WebSocket(deepgramUrl, ["token", DEEPGRAM_API_KEY]);

    // Forward messages from client to Deepgram
    socket.onmessage = async (event) => {
      try {
        if (deepgramSocket.readyState !== WebSocket.OPEN) return;
        
        let payload = event.data;
        
        // Handle different binary data types
        if (payload instanceof Blob) {
          payload = new Uint8Array(await payload.arrayBuffer());
        } else if (payload instanceof ArrayBuffer) {
          payload = new Uint8Array(payload);
        }
        
        deepgramSocket.send(payload);
      } catch (error) {
        console.error("Error forwarding to Deepgram:", error);
      }
    };

    // Forward transcriptions from Deepgram to client
    deepgramSocket.onmessage = (event) => {
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      } catch (error) {
        console.error("Error forwarding from Deepgram:", error);
      }
    };

    // Handle Deepgram connection open
    deepgramSocket.onopen = () => {
      console.log("Connected to Deepgram API for user:", user.id);
    };
    
    socket.onopen = () => {
      console.log("Client WebSocket connected for user:", user.id);
    };

    // Handle errors
    deepgramSocket.onerror = (error) => {
      console.error("Deepgram WebSocket error:", { timestamp: new Date().toISOString() });
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          error: "Connection error. Please try again." 
        }));
      }
    };

    socket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
    };

    // Handle disconnections
    deepgramSocket.onclose = (event) => {
      console.log("Deepgram connection closed for user:", user.id, { code: event.code, reason: event.reason });
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    socket.onclose = (event) => {
      console.log("Client connection closed for user:", user.id, { code: event.code, reason: event.reason });
      if (deepgramSocket.readyState === WebSocket.OPEN) {
        deepgramSocket.close();
      }
    };

    return response;
  } catch (error) {
    console.error("WebSocket setup error:", { timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
