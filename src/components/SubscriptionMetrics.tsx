import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionMetrics {
  activeSubscribers: number;
  trialUsers: number;
  conversionRate: number;
  mrr: number;
}

export function SubscriptionMetrics() {
  const [metrics, setMetrics] = useState<SubscriptionMetrics>({
    activeSubscribers: 0,
    trialUsers: 0,
    conversionRate: 0,
    mrr: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-metrics');
      
      if (error) throw error;

      setMetrics({
        activeSubscribers: data?.active_subscribers || 0,
        trialUsers: data?.trial_users || 0,
        conversionRate: data?.conversion_rate || 0,
        mrr: data?.mrr || 0,
      });
    } catch (error) {
      console.error('Error fetching subscription metrics:', error);
      toast.error("Failed to load subscription metrics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const metricsCards = [
    {
      title: "Active Subscribers",
      value: metrics.activeSubscribers,
      icon: Users,
      description: "Paying customers",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      title: "Trial Users",
      value: metrics.trialUsers,
      icon: Activity,
      description: "In free trial period",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      title: "Trial Conversion",
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      description: "Trial to paid conversion",
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
      title: "MRR",
      value: formatCurrency(metrics.mrr),
      icon: DollarSign,
      description: "Monthly recurring revenue",
      gradient: "from-orange-500/20 to-red-500/20",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass-card border-primary/20 animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metricsCards.map((card) => (
        <Card key={card.title} className="glass-card border-primary/20 hover:border-primary/40 transition-all">
          <CardHeader>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <p className="text-3xl font-bold text-foreground mt-2">
              {card.value}
            </p>
            <CardDescription className="text-xs mt-1">
              {card.description}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}