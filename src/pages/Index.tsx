import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadSection } from "@/components/UploadSection";
import { AnalysisResults } from "@/components/AnalysisResults";
import { SessionHistory } from "@/components/SessionHistory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectPoseInVideo, analyzePose } from "@/lib/poseAnalysis";
import { Upload, BarChart3, History } from "lucide-react";

interface Session {
  id: string;
  created_at: string;
  ai_score: number;
  posture_score: number;
  stability_score: number;
  smoothness_score: number;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    videoUrl: string;
    scores: {
      aiScore: number;
      posture: number;
      stability: number;
      smoothness: number;
    };
    feedback: string[];
  } | null>(null);
  const { toast } = useToast();

  // Fetch session history
  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("analysis_sessions")
      .select("id, created_at, ai_score, posture_score, stability_score, smoothness_score")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching sessions:", error);
    } else {
      setSessions(data || []);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleVideoSelect = async (file: File) => {
    // Check video duration (should be max 20 seconds)
    const video = document.createElement("video");
    video.preload = "metadata";
    
    video.onloadedmetadata = async () => {
      window.URL.revokeObjectURL(video.src);
      
      if (video.duration > 20) {
        toast({
          title: "Video too long",
          description: "Please upload a video that's 20 seconds or less.",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      toast({
        title: "Processing video",
        description: "Analyzing your routine with AI...",
      });

      try {
        // Create object URL for video display
        const videoUrl = URL.createObjectURL(file);

        // Detect pose in video
        const keypointsData = await detectPoseInVideo(file);

        // Analyze pose data
        const analysis = analyzePose(keypointsData);

        // Save to database
        const { data, error } = await supabase
          .from("analysis_sessions")
          .insert({
            video_url: videoUrl,
            duration_seconds: video.duration,
            ai_score: analysis.aiScore,
            posture_score: analysis.posture,
            stability_score: analysis.stability,
            smoothness_score: analysis.smoothness,
            feedback_text: analysis.feedback.join("\n"),
            keypoints_data: keypointsData,
            avg_knee_angle: analysis.avgKneeAngle,
            avg_hip_angle: analysis.avgHipAngle,
            landing_stability: analysis.landingStability,
          })
          .select()
          .single();

        if (error) throw error;

        // Set current analysis
        setCurrentAnalysis({
          videoUrl,
          scores: {
            aiScore: analysis.aiScore,
            posture: analysis.posture,
            stability: analysis.stability,
            smoothness: analysis.smoothness,
          },
          feedback: analysis.feedback,
        });

        // Refresh sessions
        await fetchSessions();

        // Switch to results tab
        setActiveTab("results");

        toast({
          title: "Analysis complete!",
          description: `Your AI score: ${analysis.aiScore}/10`,
        });
      } catch (error) {
        console.error("Error processing video:", error);
        toast({
          title: "Processing failed",
          description: "There was an error analyzing your video. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    video.src = URL.createObjectURL(file);
  };

  const handleNewAnalysis = () => {
    setCurrentAnalysis(null);
    setActiveTab("upload");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2" disabled={!currentAnalysis}>
              <BarChart3 className="w-4 h-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <UploadSection onVideoSelect={handleVideoSelect} isProcessing={isProcessing} />
          </TabsContent>

          <TabsContent value="results">
            {currentAnalysis && (
              <AnalysisResults
                videoUrl={currentAnalysis.videoUrl}
                scores={currentAnalysis.scores}
                feedback={currentAnalysis.feedback}
                onNewAnalysis={handleNewAnalysis}
              />
            )}
          </TabsContent>

          <TabsContent value="history">
            <SessionHistory sessions={sessions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
