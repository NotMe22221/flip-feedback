import { useState, useEffect } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { useSearchParams } from "react-router-dom";

const tiers = [
  {
    name: "Pro",
    price: "$29",
    period: "month",
    description: "14-day free trial, then $29/month",
    productId: "prod_TOSyy5geLySBFw",
    priceId: "price_1SRg2hRutEh7PyS1C29VbM3C",
    features: [
      "Unlimited video uploads",
      "AI-powered analysis",
      "Progress tracking",
      "Training plans",
      "Email support",
    ],
    icon: Zap,
    popular: false,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "month",
    description: "14-day free trial, then $99/month",
    productId: "prod_TOSyHDSECaOnpz",
    priceId: "price_1SRg2xRutEh7PyS19hXjg1fT",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Advanced analytics",
      "Custom training programs",
      "Priority support",
      "API access",
    ],
    icon: Crown,
    popular: true,
  },
];

export default function Subscription() {
  const { subscribed, productId, subscriptionEnd, trialEnd, trialActive, loading, createCheckout, openCustomerPortal, refreshSubscription } = useSubscription();
  const [processingPriceId, setProcessingPriceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success("Subscription started! Your 14-day free trial has begun.");
      refreshSubscription();
      setSearchParams({});
    } else if (canceled === 'true') {
      toast.error("Checkout canceled. No charges were made.");
      setSearchParams({});
    }
  }, [searchParams, refreshSubscription, setSearchParams]);

  const handleSubscribe = async (priceId: string) => {
    setProcessingPriceId(priceId);
    try {
      await createCheckout(priceId);
      toast.success("Opening checkout...");
    } catch (error) {
      toast.error("Failed to create checkout session");
    } finally {
      setProcessingPriceId(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error("Failed to open customer portal");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSubscription();
      toast.success("Subscription status refreshed");
    } catch (error) {
      toast.error("Failed to refresh subscription");
    } finally {
      setRefreshing(false);
    }
  };

  const isCurrentPlan = (tier: typeof tiers[0]) => {
    return subscribed && productId === tier.productId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock your full potential with FlipCoach AI
          </p>
          
          {subscribed && (
            <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
              {trialActive ? (
                <Badge variant="default" className="text-base px-4 py-2 bg-gradient-primary">
                  Free Trial Active
                  {trialEnd && (
                    <span className="ml-2 text-xs opacity-90">
                      Ends {new Date(trialEnd).toLocaleDateString()}
                    </span>
                  )}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-base px-4 py-2">
                  Active Subscription
                  {subscriptionEnd && (
                    <span className="ml-2 text-xs opacity-70">
                      Until {new Date(subscriptionEnd).toLocaleDateString()}
                    </span>
                  )}
                </Badge>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Refresh Status"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const currentPlan = isCurrentPlan(tier);
            
            return (
              <Card
                key={tier.name}
                className={`relative overflow-hidden transition-all duration-300 ${
                  tier.popular
                    ? "border-primary shadow-lg shadow-primary/20 scale-105"
                    : "hover:shadow-lg"
                } ${currentPlan ? "ring-2 ring-primary" : ""}`}
              >
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                
                {currentPlan && (
                  <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-br-lg">
                    YOUR PLAN
                  </div>
                )}

                <CardHeader className="text-center pb-8 pt-12">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="mx-auto mb-3 bg-gradient-primary/10 border-primary/20">
                    🎉 14-Day Free Trial
                  </Badge>
                  <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">/{tier.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {currentPlan ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={loading}
                    >
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      className="w-full gradient-primary glow-blue"
                      onClick={() => handleSubscribe(tier.priceId)}
                      disabled={loading || processingPriceId === tier.priceId}
                    >
                      {processingPriceId === tier.priceId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processing...
                        </>
                      ) : subscribed ? (
                        "Upgrade Plan"
                      ) : (
                        "Get Started"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Manage Subscription Section */}
        {subscribed && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Manage Your Subscription</CardTitle>
              <CardDescription>
                Update payment method, view invoices, or cancel your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleManageSubscription}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                Open Customer Portal
              </Button>
            </CardContent>
          </Card>
        )}

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>Start your 14-day free trial today - no credit card required during trial</p>
          <p className="mt-2">Cancel anytime during your trial without being charged</p>
          <p className="mt-2">Need help choosing? Contact us at support@flipcoach.ai</p>
        </div>
      </div>
    </div>
  );
}
