import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
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

    const { planId, email, permissionLevel } = await req.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error('Invalid email address');
    }

    if (!planId || !permissionLevel) {
      throw new Error('Missing required fields');
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('training_plans')
      .select('name, user_id')
      .eq('id', planId)
      .single();

    if (planError || !plan) throw new Error('Plan not found');
    if (plan.user_id !== user.id) throw new Error('Unauthorized');

    // Create share record
    const { error: shareError } = await supabase
      .from('plan_shares')
      .insert({
        plan_id: planId,
        shared_by: user.id,
        shared_with_email: email,
        permission_level: permissionLevel,
      });

    if (shareError) {
      if (shareError.code === '23505') { // Unique constraint violation
        throw new Error('This plan is already shared with this email');
      }
      throw shareError;
    }

    // Get user's email for the "from" field
    const userEmail = user.email || 'coach@flipcoach.ai';
    const userName = user.user_metadata?.name || userEmail.split('@')[0];

    // Send email invitation
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://your-app.lovable.app';
    
    const emailResponse = await resend.emails.send({
      from: "FlipCoach AI <onboarding@resend.dev>",
      to: [email],
      subject: `${userName} invited you to collaborate on "${plan.name}"`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .permission { background: #e0e7ff; padding: 10px; border-radius: 6px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎯 Training Plan Invitation</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>
                
                <p><strong>${userName}</strong> has invited you to collaborate on their training plan:</p>
                
                <h2 style="color: #667eea;">${plan.name}</h2>
                
                <div class="permission">
                  <strong>Permission Level:</strong> ${permissionLevel === 'edit' ? '✏️ Edit Access' : '👁️ View Only'}
                  <p style="margin: 5px 0 0 0; font-size: 14px;">
                    ${permissionLevel === 'edit' 
                      ? 'You can add goals, update progress, and collaborate on this plan.' 
                      : 'You can view goals, progress, and recommendations.'}
                  </p>
                </div>
                
                <p>This is a great opportunity to work together on achieving gymnastics excellence with AI-powered coaching!</p>
                
                <a href="${appUrl}/app" class="button">Accept Invitation & View Plan</a>
                
                <p style="font-size: 14px; color: #666;">
                  Click the button above to log in and accept this invitation. If you don't have an account yet, you can create one using this email address.
                </p>
              </div>
              <div class="footer">
                <p>FlipCoach AI - AI-Powered Gymnastics Coaching</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
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
