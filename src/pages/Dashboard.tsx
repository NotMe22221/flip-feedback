import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Navigation } from "@/components/Navigation";
import { SubscriptionMetrics } from "@/components/SubscriptionMetrics";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, BarChart3, History, Mic, Target, Activity, LogOut, Receipt, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    avgScore: 0,
    recentSessions: 0,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    // Get total sessions
    const { count: total } = await supabase
      .from("analysis_sessions")
      .select("*", { count: 'exact', head: true });

    // Get average AI score
    const { data: sessions } = await supabase
      .from("analysis_sessions")
      .select("ai_score")
      .not("ai_score", "is", null);

    const avgScore = sessions && sessions.length > 0
      ? sessions.reduce((acc, s) => acc + (s.ai_score || 0), 0) / sessions.length
      : 0;

    // Get recent sessions (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recent } = await supabase
      .from("analysis_sessions")
      .select("*", { count: 'exact', head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    setStats({
      totalSessions: total || 0,
      avgScore: Math.round(avgScore * 10) / 10,
      recentSessions: recent || 0,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const dashboardCards = [
    {
      title: "Upload Analysis",
      description: "Upload videos or images for AI-powered gymnastics analysis",
      icon: Upload,
      href: "/app/upload",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    {
      title: "View Results",
      description: "Review your latest analysis results and performance metrics",
      icon: BarChart3,
      href: "/app/results",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      title: "Training Plans",
      description: "Manage your training goals and personalized plans",
      icon: Target,
      href: "/app/training",
      gradient: "from-green-500/20 to-emerald-500/20",
    },
    {
      title: "Session History",
      description: "Browse all your past analysis sessions and track progress",
      icon: History,
      href: "/app/history",
      gradient: "from-orange-500/20 to-red-500/20",
    },
    {
      title: "Voice Notes",
      description: "Record and save coaching notes with speech-to-text",
      icon: Mic,
      href: "/app/notes",
      gradient: "from-indigo-500/20 to-violet-500/20",
    },
  ];

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navigation />
      
      <div className="container mx-auto py-8 px-4 relative z-10 pt-24">
        {/* Header Card */}
        <Card className="glass-strong border-primary/30 mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Activity className="h-10 w-10 text-primary" />
                <div>
                  <CardTitle className="text-3xl">
                    Welcome to FlipCoach AI
                  </CardTitle>
                  <p className="text-foreground/70 mt-1">
                    AI-powered gymnastics analysis and coaching
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => navigate('/billing')} className="gap-2">
                  <Receipt className="w-4 h-4" />
                  Billing
                </Button>
                <Button variant="ghost" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Subscription Metrics */}
        <SubscriptionMetrics />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="w-5 h-5 text-primary" />
                Total Sessions
              </CardTitle>
              <p className="text-4xl font-bold text-primary mt-2">{stats.totalSessions}</p>
            </CardHeader>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Average Score
              </CardTitle>
              <p className="text-4xl font-bold text-primary mt-2">{stats.avgScore}/10</p>
            </CardHeader>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-primary" />
                Last 7 Days
              </CardTitle>
              <p className="text-4xl font-bold text-primary mt-2">{stats.recentSessions}</p>
            </CardHeader>
          </Card>
        </div>

        {/* Main Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card) => (
            <Card
              key={card.title}
              className="glass-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
              onClick={() => navigate(card.href)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{card.title}</CardTitle>
                <CardDescription className="text-foreground/70">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full group-hover:bg-primary/10">
                  Open {card.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
