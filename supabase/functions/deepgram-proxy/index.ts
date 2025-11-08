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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
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

    console.log("Upgrading to WebSocket connection");
    const { socket, response } = Deno.upgradeWebSocket(req);

    // Connect to Deepgram's streaming API with opus encoding
    const deepgramUrl = "wss://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&interim_results=true&encoding=opus";
    
    console.log("Connecting to Deepgram API");
    // Authenticate using Sec-WebSocket-Protocol header
    const deepgramSocket = new WebSocket(deepgramUrl, ["token", DEEPGRAM_API_KEY]);

    // Forward messages from client to Deepgram
    socket.onmessage = (event) => {
      try {
        if (deepgramSocket.readyState === WebSocket.OPEN) {
          deepgramSocket.send(event.data);
        }
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
      console.log("Connected to Deepgram API");
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
      console.log("Deepgram connection closed", { code: event.code, reason: event.reason });
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    socket.onclose = (event) => {
      console.log("Client connection closed", { code: event.code, reason: event.reason });
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
