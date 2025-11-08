import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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
        timestamp: new Date().toISOString(),
      });
      
      let errorMessage = "Failed to generate voice agent URL";
      
      if (response.status === 401) {
        errorMessage = "Service configuration error";
      } else if (response.status === 404) {
        errorMessage = "Voice agent not found";
      } else if (response.status === 403) {
        errorMessage = "Access denied to voice agent";
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
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
    console.error("Error in elevenlabs-signed-url function:", { timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
