import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== ElevenLabs Signed URL Request ===");
    const { agentId } = await req.json();
    console.log("Requested Agent ID:", agentId);
    
    if (!agentId) {
      console.error("No agent ID provided");
      return new Response(
        JSON.stringify({ error: "Agent ID is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY is not configured");
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }
    
    console.log("API key found, making request to ElevenLabs...");

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`;
    console.log("Request URL:", elevenLabsUrl);

    const response = await fetch(elevenLabsUrl, {
      method: "GET",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });

    console.log("ElevenLabs Response Status:", response.status);
    console.log("ElevenLabs Response Headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      
      let errorMessage = "Failed to get signed URL from ElevenLabs";
      
      if (response.status === 401) {
        errorMessage = "Invalid ElevenLabs API key";
      } else if (response.status === 404) {
        errorMessage = `Agent not found. Please verify the agent ID: ${agentId}`;
      } else if (response.status === 403) {
        errorMessage = "Access denied. Check if the agent is public or your API key has access";
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          agentId: agentId
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const data = await response.json();
    console.log("ElevenLabs Response Data:", data);

    if (!data.signed_url) {
      console.error("No signed_url in response:", data);
      throw new Error("No signed_url returned from ElevenLabs");
    }

    console.log("Successfully obtained signed URL");
    return new Response(
      JSON.stringify({ signedUrl: data.signed_url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("=== Error in elevenlabs-signed-url function ===");
    console.error("Error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "N/A");
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : typeof error
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
