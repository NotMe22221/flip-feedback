import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Connect to Deepgram's streaming API
    const deepgramUrl = "wss://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&interim_results=true";
    
    console.log("Connecting to Deepgram API");
    const deepgramSocket = new WebSocket(deepgramUrl, {
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
      },
    });

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
      console.error("Deepgram WebSocket error:", error);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          error: "Deepgram connection error" 
        }));
      }
    };

    socket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
    };

    // Handle disconnections
    deepgramSocket.onclose = () => {
      console.log("Deepgram connection closed");
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    socket.onclose = () => {
      console.log("Client connection closed");
      if (deepgramSocket.readyState === WebSocket.OPEN) {
        deepgramSocket.close();
      }
    };

    return response;
  } catch (error) {
    console.error("WebSocket setup error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
