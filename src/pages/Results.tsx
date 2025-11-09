import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalysisResults } from "@/components/AnalysisResults";
import { AggregatedResults } from "@/components/AggregatedResults";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Activity, LogOut, Receipt } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { AnalysisData, BatchAnalysisResult } from "./Upload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const analysis = location.state?.analysis as AnalysisData | undefined;
  const batchResults = location.state?.batchResults as BatchAnalysisResult[] | undefined;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const handleNewAnalysis = () => {
    navigate('/app/upload');
  };

  if (!analysis && (!batchResults || batchResults.length === 0)) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <Navigation />
        
        <div className="container mx-auto py-8 px-4 relative z-10 pt-24">
          <Card className="glass-strong border-primary/30">
            <CardHeader>
              <CardTitle className="text-center text-2xl">No Results Available</CardTitle>
              <p className="text-center text-foreground/70 mt-4">
                Upload a video or image to see analysis results
              </p>
              <Button onClick={handleNewAnalysis} className="mx-auto mt-6">
                Go to Upload
              </Button>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

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
                    Analysis Results
                  </CardTitle>
                  <p className="text-foreground/70 mt-1">
                    Review your performance analysis
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

        {analysis ? (
          <AnalysisResults
            videoUrl={analysis.videoUrl}
            keypointsData={analysis.keypointsData}
            scores={analysis.scores}
            feedback={analysis.feedback}
            visionAnalysis={analysis.visionAnalysis}
            onNewAnalysis={handleNewAnalysis}
          />
        ) : batchResults && batchResults.length > 0 ? (
          <AggregatedResults
            results={batchResults}
            onNewAnalysis={handleNewAnalysis}
          />
        ) : null}
      </div>
    </div>
  );
};

export default Results;
