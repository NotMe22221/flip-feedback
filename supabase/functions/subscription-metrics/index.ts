import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-METRICS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all active subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
    });
    logStep("Fetched active subscriptions", { count: activeSubscriptions.data.length });

    // Separate trial and paid subscriptions
    const trialSubs = activeSubscriptions.data.filter((sub: any) => sub.status === "trialing");
    const paidSubs = activeSubscriptions.data.filter((sub: any) => sub.status === "active" && sub.status !== "trialing");

    logStep("Separated subscriptions", { 
      trials: trialSubs.length, 
      paid: paidSubs.length 
    });

    // Calculate MRR (Monthly Recurring Revenue)
    let mrr = 0;
    for (const sub of paidSubs) {
      const price = sub.items.data[0]?.price;
      if (price && price.recurring) {
        const amount = price.unit_amount || 0;
        // Convert to monthly if needed
        if (price.recurring.interval === "year") {
          mrr += amount / 12;
        } else if (price.recurring.interval === "month") {
          mrr += amount;
        }
      }
    }
    // Convert from cents to dollars
    mrr = mrr / 100;

    // Calculate conversion rate
    // For simplicity, we'll use all-time metrics
    // In production, you'd want to track this over time in a database
    const totalTrials = trialSubs.length;
    const totalPaid = paidSubs.length;
    const conversionRate = totalPaid + totalTrials > 0 
      ? (totalPaid / (totalPaid + totalTrials)) * 100 
      : 0;

    logStep("Calculated metrics", { 
      mrr, 
      conversionRate: conversionRate.toFixed(2) 
    });

    return new Response(JSON.stringify({
      active_subscribers: paidSubs.length,
      trial_users: trialSubs.length,
      conversion_rate: conversionRate,
      mrr: mrr,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in subscription-metrics", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});