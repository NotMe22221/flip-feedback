import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadSection } from "@/components/UploadSection";
import { AnalysisResults } from "@/components/AnalysisResults";
import { SessionHistory } from "@/components/SessionHistory";
import { SpeechToText } from "@/components/SpeechToText";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectPoseInVideo, detectPoseInImage, analyzePose, PoseKeypoint } from "@/lib/poseAnalysis";
import { extractFramesFromVideo, imageToBase64 } from "@/lib/videoFrameExtractor";
import { Upload, BarChart3, History, Mic, Activity, LogOut } from "lucide-react";

interface SessionData {
  id: string;
  created_at: string;
  ai_score: number | null;
  posture_score: number | null;
  stability_score: number | null;
  smoothness_score: number | null;
  voice_notes: string | null;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState<any>(null);
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
    visionAnalysis?: {
      labels: Array<{ description: string; score: number }>;
      objects: Array<{ name: string; score: number }>;
      dominantColors: any[];
    };
  } | null>(null);
  const { toast } = useToast();

  // Set up auth state
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

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
  }, [user]);

  const analyzeWithVision = async (imageData: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-vision', {
        body: { image: imageData }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Vision API error:', error);
      return null;
    }
  };

  const handleImageSelect = async (file: File) => {
    setIsProcessing(true);
    
    const progressToast = toast({
      title: "Processing image",
      description: "Detecting pose landmarks...",
      duration: Infinity,
    });

    try {
      // Convert image to base64
      const imageData = await imageToBase64(file);

      // Upload image to Supabase storage
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("routine-videos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("routine-videos")
        .getPublicUrl(filePath);

      // Detect pose in image
      progressToast.update({
        id: progressToast.id,
        description: "Analyzing pose with MediaPipe...",
      });

      const poseKeypoints = await detectPoseInImage(file);

      // Analyze with Vision API
      progressToast.update({
        id: progressToast.id,
        description: "Analyzing scene with Google Cloud Vision...",
      });

      const visionAnalysis = await analyzeWithVision(imageData);

      // Analyze pose if detected
      let poseAnalysis = null;
      let feedback: string[] = [];
      
      if (poseKeypoints.length > 0) {
        poseAnalysis = analyzePose([poseKeypoints]);
        feedback = poseAnalysis.feedback;
      } else {
        feedback.push("No pose detected in image");
      }

      // Add vision analysis feedback
      if (visionAnalysis?.labels) {
        feedback.push(
          `Environment: ${visionAnalysis.labels.slice(0, 3).map((l: any) => l.description).join(', ')}`
        );
      }

      const aiScore = poseAnalysis ? poseAnalysis.aiScore : (visionAnalysis ? 7.0 : 0);

      // Save to database
      await supabase.from("analysis_sessions").insert({
        user_id: user.id,
        video_path: filePath,
        video_url: publicUrl,
        ai_score: aiScore,
        posture_score: poseAnalysis?.posture || 0,
        stability_score: poseAnalysis?.stability || 0,
        smoothness_score: poseAnalysis?.smoothness || 0,
        feedback_text: feedback.join('\n'),
        keypoints_data: poseKeypoints.length > 0 ? [poseKeypoints] : [] as any,
      } as any);

      // Set current analysis
      setCurrentAnalysis({
        videoUrl: publicUrl,
        keypointsData: poseKeypoints.length > 0 ? [poseKeypoints] : [],
        scores: {
          aiScore,
          posture: poseAnalysis?.posture || 0,
          stability: poseAnalysis?.stability || 0,
          smoothness: poseAnalysis?.smoothness || 0,
        },
        feedback,
        visionAnalysis,
      });

      await fetchSessions();
      setActiveTab("results");

      progressToast.dismiss();
      toast({
        title: "Analysis complete!",
        description: poseKeypoints.length > 0 
          ? `Pose detected with ${poseKeypoints.length} landmarks` 
          : "Image analyzed",
      });
    } catch (error) {
      console.error("Error processing image:", error);
      progressToast?.dismiss();
      toast({
        title: "Processing failed",
        description: "There was an error analyzing your image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
        // Upload video to Supabase storage with user folder
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${user.id}/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("routine-videos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("routine-videos")
          .getPublicUrl(filePath);

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

        // Extract frames and analyze with Vision API
        progressToast.update({
          id: progressToast.id,
          title: "Analyzing environment",
          description: "Extracting frames for Vision API analysis...",
        });

        const frames = await extractFramesFromVideo(file, 3);
        let visionAnalysis = null;
        
        if (frames.length > 0) {
          visionAnalysis = await analyzeWithVision(frames[0]);
        }

        // Save to database
        const { data, error } = await supabase
          .from("analysis_sessions")
          .insert({
            user_id: user.id,
            video_path: filePath,
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
          feedback: [
            ...analysis.feedback,
            ...(visionAnalysis?.labels ? [
              `Environment detected: ${visionAnalysis.labels.slice(0, 3).map((l: any) => l.description).join(', ')}`
            ] : [])
          ],
          visionAnalysis: visionAnalysis || undefined,
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
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="container mx-auto py-8 px-4 relative z-10">
        <Card className="glass-strong border-primary/30 mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Activity className="h-10 w-10 text-primary" />
                <div>
                  <CardTitle className="text-3xl">
                    Routine Analysis Coach
                  </CardTitle>
                  <p className="text-foreground/70 mt-1">
                    AI-powered gymnastics analysis and coaching
                  </p>
                </div>
              </div>
              <Button variant="glass" onClick={handleSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </CardHeader>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8 glass-card">
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
            <UploadSection 
              onVideoSelect={handleVideoSelect} 
              onImageSelect={handleImageSelect}
              isProcessing={isProcessing} 
            />
          </TabsContent>

          <TabsContent value="results">
            {currentAnalysis && (
              <AnalysisResults
                videoUrl={currentAnalysis.videoUrl}
                keypointsData={currentAnalysis.keypointsData}
                scores={currentAnalysis.scores}
                feedback={currentAnalysis.feedback}
                visionAnalysis={currentAnalysis.visionAnalysis}
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
