import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { planId } = await req.json();

    // Fetch recent sessions (last 10)
    const { data: sessions, error: sessionsError } = await supabase
      .from('analysis_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionsError) throw sessionsError;

    // Fetch current goals
    const { data: goals, error: goalsError } = await supabase
      .from('training_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', planId)
      .eq('is_completed', false);

    if (goalsError) throw goalsError;

    // Calculate stats
    const avgAiScore = sessions.reduce((sum, s) => sum + (s.ai_score || 0), 0) / sessions.length;
    const avgPosture = sessions.reduce((sum, s) => sum + (s.posture_score || 0), 0) / sessions.length;
    const avgStability = sessions.reduce((sum, s) => sum + (s.stability_score || 0), 0) / sessions.length;
    const avgSmoothness = sessions.reduce((sum, s) => sum + (s.smoothness_score || 0), 0) / sessions.length;

    // Analyze trends
    const recentScores = sessions.slice(0, 5).map(s => s.ai_score || 0);
    const trend = recentScores[0] > recentScores[recentScores.length - 1] ? 'improving' : 
                  recentScores[0] < recentScores[recentScores.length - 1] ? 'declining' : 'stable';

    // Build context for AI
    const context = `
Athlete Performance Analysis:
- Average AI Score: ${avgAiScore.toFixed(1)}/10
- Average Posture: ${avgPosture.toFixed(0)}%
- Average Stability: ${avgStability.toFixed(0)}%
- Average Smoothness: ${avgSmoothness.toFixed(0)}%
- Recent Trend: ${trend}
- Total Sessions: ${sessions.length}

Current Goals:
${goals.map(g => `- ${g.title}: Target ${g.target_value} (${g.target_metric}), Current ${g.current_value}`).join('\n')}

Recent Session Feedback:
${sessions.slice(0, 3).map(s => `- ${s.feedback_text}`).join('\n')}
    `.trim();

    // Call Lovable AI for recommendations
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert gymnastics coach analyzing athlete performance data. Provide 3-5 specific, actionable recommendations to help the athlete improve. Focus on their weakest areas and how to achieve their goals. Be concise and motivating.'
          },
          {
            role: 'user',
            content: context
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_recommendations',
            description: 'Generate personalized training recommendations',
            parameters: {
              type: 'object',
              properties: {
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      type: { type: 'string', enum: ['focus_area', 'technique', 'practice', 'milestone'] },
                      priority: { type: 'string', enum: ['low', 'medium', 'high'] }
                    },
                    required: ['text', 'type', 'priority']
                  }
                }
              },
              required: ['recommendations']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_recommendations' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      throw new Error('AI generation failed');
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No recommendations generated');
    }

    const { recommendations } = JSON.parse(toolCall.function.arguments);

    // Save recommendations to database
    const recommendationsToInsert = recommendations.map((rec: any) => ({
      user_id: user.id,
      plan_id: planId,
      recommendation_text: rec.text,
      recommendation_type: rec.type,
      priority: rec.priority,
    }));

    const { error: insertError } = await supabase
      .from('ai_recommendations')
      .insert(recommendationsToInsert);

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
