import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      throw new Error('No image data provided');
    }

    const VISION_API_KEY = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY');
    if (!VISION_API_KEY) {
      throw new Error('GOOGLE_CLOUD_VISION_API_KEY not configured');
    }

    // Remove data URL prefix if present
    const base64Image = image.includes('base64,') 
      ? image.split('base64,')[1] 
      : image;

    console.log('Analyzing image with Google Cloud Vision API...');

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 10 },
                { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                { type: 'IMAGE_PROPERTIES' },
                { type: 'SAFE_SEARCH_DETECTION' },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API error:', response.status, errorText);
      throw new Error(`Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Vision API response received');

    // Extract useful information
    const result = data.responses[0];
    
    const analysis = {
      labels: result.labelAnnotations?.map((label: any) => ({
        description: label.description,
        score: label.score,
      })) || [],
      objects: result.localizedObjectAnnotations?.map((obj: any) => ({
        name: obj.name,
        score: obj.score,
      })) || [],
      dominantColors: result.imagePropertiesAnnotation?.dominantColors?.colors?.slice(0, 5).map((color: any) => ({
        color: color.color,
        score: color.score,
        pixelFraction: color.pixelFraction,
      })) || [],
      safeSearch: result.safeSearchAnnotation,
    };

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-vision function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
