import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpeechToText } from "@/components/SpeechToText";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Activity, LogOut, Receipt } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Notes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

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
                    Voice Notes
                  </CardTitle>
                  <p className="text-foreground/70 mt-1">
                    Record and save your coaching notes
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

        <div className="max-w-2xl mx-auto">
          <SpeechToText onSaveNote={() => {
            toast({
              title: "Note saved",
              description: "Your voice note has been saved to the session history",
            });
          }} />
        </div>
      </div>
    </div>
  );
};

export default Notes;
