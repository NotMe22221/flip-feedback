import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadSection } from "@/components/UploadSection";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectPoseInVideo, detectPoseInImage, analyzePose, PoseKeypoint } from "@/lib/poseAnalysis";
import { extractFramesFromVideo, imageToBase64 } from "@/lib/videoFrameExtractor";
import { Activity, LogOut, Receipt } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { BatchFileStatus } from "@/components/BatchUploadProgress";

export interface AnalysisData {
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
}

export interface BatchAnalysisResult {
  fileName: string;
  videoUrl: string;
  aiScore: number;
  posture: number;
  stability: number;
  smoothness: number;
  createdAt: Date;
}

const Upload = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

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
    navigate('/auth');
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

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
      const imageData = await imageToBase64(file);
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("routine-videos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("routine-videos")
        .getPublicUrl(filePath);

      progressToast.update({
        id: progressToast.id,
        description: "Analyzing pose with MediaPipe...",
      });

      const poseKeypoints = await detectPoseInImage(file);

      progressToast.update({
        id: progressToast.id,
        description: "Analyzing scene with Google Cloud Vision...",
      });

      const visionAnalysis = await analyzeWithVision(imageData);

      let poseAnalysis = null;
      let feedback: string[] = [];
      
      if (poseKeypoints.length > 0) {
        poseAnalysis = analyzePose([poseKeypoints]);
        feedback = poseAnalysis.feedback;
      } else {
        feedback.push("No pose detected in image");
      }

      if (visionAnalysis?.labels) {
        feedback.push(
          `Environment: ${visionAnalysis.labels.slice(0, 3).map((l: any) => l.description).join(', ')}`
        );
      }

      const aiScore = poseAnalysis ? poseAnalysis.aiScore : (visionAnalysis ? 7.0 : 0);

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

      const analysisData: AnalysisData = {
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
      };

      progressToast.dismiss();
      toast({
        title: "Analysis complete!",
        description: poseKeypoints.length > 0 
          ? `Pose detected with ${poseKeypoints.length} landmarks` 
          : "Image analyzed",
      });

      navigate('/app/results', { state: { analysis: analysisData } });
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
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("routine-videos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("routine-videos")
          .getPublicUrl(filePath);

        const keypointsData = await detectPoseInVideo(file, (progress) => {
          progressToast.update({
            id: progressToast.id,
            title: "Processing video",
            description: `Detecting pose landmarks... ${progress}%`,
          });
        });

        progressToast.update({
          id: progressToast.id,
          title: "Analyzing performance",
          description: "Calculating scores and generating feedback...",
        });

        const analysis = analyzePose(keypointsData);

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

        await supabase
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
          } as any);

        const analysisData: AnalysisData = {
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
        };

        progressToast.dismiss();
        toast({
          title: "Analysis complete!",
          description: `Your AI score: ${analysis.aiScore}/10`,
        });

        navigate('/app/results', { state: { analysis: analysisData } });
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

  const handleBatchSelect = async (files: File[]) => {
    navigate('/app/batch', { state: { files } });
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
                    Upload for Analysis
                  </CardTitle>
                  <p className="text-foreground/70 mt-1">
                    Upload your gymnastics routine videos or images
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

        <UploadSection 
          onVideoSelect={handleVideoSelect} 
          onImageSelect={handleImageSelect}
          onBatchSelect={handleBatchSelect}
          isProcessing={isProcessing} 
        />
      </div>
    </div>
  );
};

export default Upload;
