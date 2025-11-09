import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionHistory } from "@/components/SessionHistory";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity, LogOut, Receipt } from "lucide-react";
import { Navigation } from "@/components/Navigation";

interface SessionData {
  id: string;
  created_at: string;
  ai_score: number | null;
  posture_score: number | null;
  stability_score: number | null;
  smoothness_score: number | null;
  voice_notes: string | null;
}

const History = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const ITEMS_PER_PAGE = 10;

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

  const fetchSessions = async (page: number = 1) => {
    const { count } = await supabase
      .from("analysis_sessions")
      .select("*", { count: 'exact', head: true });

    const totalCount = count || 0;
    setTotalPages(Math.ceil(totalCount / ITEMS_PER_PAGE));

    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from("analysis_sessions")
      .select("id, created_at, ai_score, posture_score, stability_score, smoothness_score, voice_notes")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching sessions:", error);
    } else {
      setSessions(data || []);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchSessions(page);
  };

  useEffect(() => {
    if (user) {
      fetchSessions(currentPage);
    }
  }, [user, currentPage]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navigation />
      
      <div className="container mx-auto py-8 px-4 relative z-10 pt-24">
        <Card className="glass-strong border-primary/30 mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Activity className="h-10 w-10 text-primary" />
                <div>
                  <CardTitle className="text-3xl">
                    Session History
                  </CardTitle>
                  <p className="text-foreground/70 mt-1">
                    View all your past analysis sessions
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

        <SessionHistory 
          sessions={sessions} 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default History;
