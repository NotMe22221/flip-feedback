import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadSection } from "@/components/UploadSection";
import { AnalysisResults } from "@/components/AnalysisResults";
import { SessionHistory } from "@/components/SessionHistory";
import { SpeechToText } from "@/components/SpeechToText";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectPoseInVideo, analyzePose, PoseKeypoint } from "@/lib/poseAnalysis";
import { Upload, BarChart3, History, Mic } from "lucide-react";

interface Session {
  id: string;
  created_at: string;
  ai_score: number | null;
  posture_score: number | null;
  stability_score: number | null;
  smoothness_score: number | null;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    videoUrl: string;
    keypointsData: PoseKeypoint[][];
    scores: {
      aiScore: number;
      posture: number;
      stability: number;
      smoothness: number;
    };
    feedback: string[];
  } | null>(null);
  const { toast } = useToast();

  // Fetch session history with pagination
  const fetchSessions = async (page: number = 1) => {
    // Get total count
    const { count } = await supabase
      .from("analysis_sessions")
      .select("*", { count: 'exact', head: true });

    const totalCount = count || 0;
    setTotalPages(Math.ceil(totalCount / ITEMS_PER_PAGE));

    // Fetch paginated data
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from("analysis_sessions")
      .select("id, created_at, ai_score, posture_score, stability_score, smoothness_score")
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
    fetchSessions(currentPage);
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
      
      let progressToast = toast({
        title: "Processing video",
        description: "Detecting pose landmarks... 0%",
        duration: Infinity,
      });

      try {
        // Upload video to Supabase storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("routine-videos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("routine-videos")
          .getPublicUrl(fileName);

        // Detect pose in video with progress updates
        const keypointsData = await detectPoseInVideo(file, (progress) => {
          progressToast.update({
            id: progressToast.id,
            title: "Processing video",
            description: `Detecting pose landmarks... ${progress}%`,
          });
        });

        // Update toast for analysis phase
        progressToast.update({
          id: progressToast.id,
          title: "Analyzing performance",
          description: "Calculating scores and generating feedback...",
        });

        // Analyze pose data
        const analysis = analyzePose(keypointsData);

        // Save to database
        const { data, error } = await supabase
          .from("analysis_sessions")
          .insert({
            video_path: fileName,
            duration_seconds: video.duration,
            ai_score: analysis.aiScore,
            posture_score: analysis.posture,
            stability_score: analysis.stability,
            smoothness_score: analysis.smoothness,
            feedback_text: analysis.feedback.join("\n"),
            keypoints_data: keypointsData as any,
            avg_knee_angle: analysis.avgKneeAngle,
            avg_hip_angle: analysis.avgHipAngle,
            landing_stability: analysis.landingStability,
          } as any)
          .select()
          .single();

        if (error) throw error;

        // Set current analysis
        setCurrentAnalysis({
          videoUrl: publicUrl,
          keypointsData,
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

        // Dismiss progress toast and show success
        progressToast.dismiss();
        toast({
          title: "Analysis complete!",
          description: `Your AI score: ${analysis.aiScore}/10`,
        });
      } catch (error) {
        console.error("Error processing video:", error);
        progressToast?.dismiss();
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
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2" disabled={!currentAnalysis}>
              <BarChart3 className="w-4 h-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <Mic className="w-4 h-4" />
              Notes
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
                keypointsData={currentAnalysis.keypointsData}
                scores={currentAnalysis.scores}
                feedback={currentAnalysis.feedback}
                onNewAnalysis={handleNewAnalysis}
              />
            )}
          </TabsContent>

          <TabsContent value="notes">
            <div className="max-w-2xl mx-auto">
              <SpeechToText onSaveNote={(note) => {
                toast({
                  title: "Note saved",
                  description: "Your voice note has been saved to the session history",
                });
                fetchSessions();
              }} />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <SessionHistory 
              sessions={sessions} 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
