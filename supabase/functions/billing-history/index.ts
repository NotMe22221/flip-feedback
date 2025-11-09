import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BILLING-HISTORY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    
    // Handle anonymous users or users without email gracefully
    if (!user || !user.email) {
      logStep("User is anonymous or has no email, returning empty transactions");
      return new Response(JSON.stringify({ transactions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Find customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ invoices: [], paymentIntents: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Fetch invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50,
    });
    logStep("Fetched invoices", { count: invoices.data.length });

    // Fetch payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 50,
    });
    logStep("Fetched payment intents", { count: paymentIntents.data.length });

    // Format the data
    const formattedInvoices = invoices.data.map((invoice: any) => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000).toISOString(),
      amount: invoice.total / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      description: invoice.lines.data[0]?.description || "Subscription",
      type: "invoice",
    }));

    const formattedPayments = paymentIntents.data
      .filter((pi: any) => pi.status === "succeeded")
      .map((pi: any) => ({
        id: pi.id,
        date: new Date(pi.created * 1000).toISOString(),
        amount: pi.amount / 100,
        currency: pi.currency.toUpperCase(),
        status: pi.status,
        description: pi.description || "One-time payment",
        type: "payment",
      }));

    // Combine and sort by date
    const allTransactions = [...formattedInvoices, ...formattedPayments]
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    logStep("Returning billing history", { totalCount: allTransactions.length });

    return new Response(JSON.stringify({ transactions: allTransactions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in billing-history", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
