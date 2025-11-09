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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get all subscriptions for growth metrics
    const allSubscriptions = await stripe.subscriptions.list({
      status: "all",
      limit: 100,
    });
    logStep("Fetched all subscriptions", { count: allSubscriptions.data.length });

    // Get active subscriptions
    const activeSubscriptions = allSubscriptions.data.filter((sub: any) => sub.status === "active" || sub.status === "trialing");
    const trialSubs = activeSubscriptions.filter((sub: any) => sub.status === "trialing");
    const paidSubs = activeSubscriptions.filter((sub: any) => sub.status === "active" && sub.status !== "trialing");

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
        if (price.recurring.interval === "year") {
          mrr += amount / 12;
        } else if (price.recurring.interval === "month") {
          mrr += amount;
        }
      }
    }
    mrr = mrr / 100;

    // Calculate conversion rate
    const totalTrials = trialSubs.length;
    const totalPaid = paidSubs.length;
    const conversionRate = totalPaid + totalTrials > 0 
      ? (totalPaid / (totalPaid + totalTrials)) * 100 
      : 0;

    // Calculate growth data for the last 30 days
    const growthData: Array<{
      date: string;
      subscribers: number;
      trials: number;
      mrr: number;
    }> = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dailySubscriptions = allSubscriptions.data.filter((sub: any) => {
        const createdDate = new Date(sub.created * 1000);
        return createdDate <= date && (sub.status === 'active' || sub.status === 'trialing');
      });
      
      const activeCount = dailySubscriptions.filter((s: any) => s.status === 'active').length;
      const trialCount = dailySubscriptions.filter((s: any) => s.status === 'trialing').length;
      const dailyMRR = dailySubscriptions
        .filter((s: any) => s.status === 'active')
        .reduce((sum: number, sub: any) => {
          const price = sub.items.data[0]?.price;
          const amount = price?.unit_amount || 0;
          return sum + (amount / 100);
        }, 0);
      
      growthData.push({
        date: dateStr,
        subscribers: activeCount,
        trials: trialCount,
        mrr: Math.round(dailyMRR),
      });
    }

    // Calculate subscription breakdown by product
    const productCounts: Record<string, number> = {};
    paidSubs.forEach((sub: any) => {
      const productId = sub.items.data[0]?.price?.product as string;
      productCounts[productId] = (productCounts[productId] || 0) + 1;
    });
    
    const subscriptionBreakdown = Object.entries(productCounts).map(([productId, count]) => ({
      name: productId.includes('TOSy') ? 'Pro' : 'Enterprise',
      value: count,
    }));

    logStep("Calculated metrics", { 
      mrr, 
      conversionRate: conversionRate.toFixed(2),
      growthDataPoints: growthData.length 
    });

    return new Response(JSON.stringify({
      active_subscribers: paidSubs.length,
      trial_users: trialSubs.length,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      mrr: Math.round(mrr),
      growth_data: growthData,
      subscription_breakdown: subscriptionBreakdown,
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