import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BatchUploadProgress, BatchFileStatus } from "@/components/BatchUploadProgress";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectPoseInVideo, detectPoseInImage, analyzePose, PoseKeypoint } from "@/lib/poseAnalysis";
import { imageToBase64 } from "@/lib/videoFrameExtractor";
import { Activity, LogOut, Receipt } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { BatchAnalysisResult } from "./Upload";

const BatchProgress = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const files = location.state?.files as File[] | undefined;
  
  const [user, setUser] = useState<any>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<Map<string, BatchFileStatus>>(new Map());
  const [batchResults, setBatchResults] = useState<BatchAnalysisResult[]>([]);

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
    if (files && files.length > 0 && user && !isBatchProcessing) {
      processBatch(files);
    }
  }, [files, user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const processBatch = async (filesToProcess: File[]) => {
    const batchId = crypto.randomUUID();
    setIsBatchProcessing(true);
    setBatchResults([]);
    
    const initialProgress = new Map<string, BatchFileStatus>();
    filesToProcess.forEach((file, index) => {
      initialProgress.set(`${index}`, {
        file,
        status: 'waiting',
        progress: 0,
      });
    });
    setBatchProgress(initialProgress);

    const results: BatchAnalysisResult[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const fileKey = `${i}`;
      
      try {
        setBatchProgress(prev => {
          const newMap = new Map(prev);
          const current = newMap.get(fileKey);
          if (current) {
            newMap.set(fileKey, { ...current, status: 'processing', progress: 0 });
          }
          return newMap;
        });

        const isVideo = file.type.startsWith("video/");
        let analysis: any;
        let publicUrl: string;
        let keypointsData: PoseKeypoint[][];

        if (isVideo) {
          const video = document.createElement("video");
          video.preload = "metadata";
          
          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => {
              window.URL.revokeObjectURL(video.src);
              if (video.duration > 20) {
                reject(new Error("Video too long"));
              }
              resolve();
            };
            video.src = URL.createObjectURL(file);
          });

          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `${user.id}/${fileName}`;
          await supabase.storage.from("routine-videos").upload(filePath, file);
          
          const { data: { publicUrl: url } } = supabase.storage
            .from("routine-videos")
            .getPublicUrl(filePath);
          publicUrl = url;

          keypointsData = await detectPoseInVideo(file, (progress) => {
            setBatchProgress(prev => {
              const newMap = new Map(prev);
              const current = newMap.get(fileKey);
              if (current) {
                newMap.set(fileKey, { ...current, progress });
              }
              return newMap;
            });
          });

          analysis = analyzePose(keypointsData);

          await supabase.from("analysis_sessions").insert({
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
            batch_id: batchId,
          } as any);
        } else {
          const imageData = await imageToBase64(file);
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `${user.id}/${fileName}`;
          await supabase.storage.from("routine-videos").upload(filePath, file);
          
          const { data: { publicUrl: url } } = supabase.storage
            .from("routine-videos")
            .getPublicUrl(filePath);
          publicUrl = url;

          const poseKeypoints = await detectPoseInImage(file);
          keypointsData = poseKeypoints.length > 0 ? [poseKeypoints] : [];

          if (poseKeypoints.length > 0) {
            analysis = analyzePose([poseKeypoints]);
          } else {
            analysis = { aiScore: 5, posture: 50, stability: 50, smoothness: 50, feedback: ["No pose detected"] };
          }

          await supabase.from("analysis_sessions").insert({
            user_id: user.id,
            video_path: filePath,
            video_url: publicUrl,
            ai_score: analysis.aiScore,
            posture_score: analysis.posture,
            stability_score: analysis.stability,
            smoothness_score: analysis.smoothness,
            feedback_text: analysis.feedback.join('\n'),
            keypoints_data: keypointsData as any,
            batch_id: batchId,
          } as any);
        }

        results.push({
          fileName: file.name,
          videoUrl: publicUrl,
          aiScore: analysis.aiScore,
          posture: analysis.posture,
          stability: analysis.stability,
          smoothness: analysis.smoothness,
          createdAt: new Date(),
        });

        setBatchProgress(prev => {
          const newMap = new Map(prev);
          const current = newMap.get(fileKey);
          if (current) {
            newMap.set(fileKey, {
              ...current,
              status: 'complete',
              progress: 100,
              aiScore: analysis.aiScore,
            });
          }
          return newMap;
        });

      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        setBatchProgress(prev => {
          const newMap = new Map(prev);
          const current = newMap.get(fileKey);
          if (current) {
            newMap.set(fileKey, {
              ...current,
              status: 'failed',
              error: error instanceof Error ? error.message : "Processing failed",
            });
          }
          return newMap;
        });
      }
    }

    setBatchResults(results);
    setIsBatchProcessing(false);
    
    toast({
      title: "Batch processing complete!",
      description: `Processed ${results.length} of ${filesToProcess.length} files successfully`,
    });

    setTimeout(() => {
      navigate('/app/results', { state: { batchResults: results } });
    }, 2000);
  };

  const handleCancelBatch = () => {
    setIsBatchProcessing(false);
    setBatchProgress(new Map());
    setBatchResults([]);
    navigate('/app/upload');
  };

  if (!files || files.length === 0) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <Navigation />
        
        <div className="container mx-auto py-8 px-4 relative z-10 pt-24">
          <Card className="glass-strong border-primary/30">
            <CardHeader>
              <CardTitle className="text-center text-2xl">No Batch Upload in Progress</CardTitle>
              <p className="text-center text-foreground/70 mt-4">
                Go to upload page to start a batch upload
              </p>
              <Button onClick={() => navigate('/app/upload')} className="mx-auto mt-6">
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
                    Batch Processing
                  </CardTitle>
                  <p className="text-foreground/70 mt-1">
                    Processing {files.length} files
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

        {batchProgress.size > 0 && (
          <BatchUploadProgress
            batchProgress={batchProgress}
            onCancel={handleCancelBatch}
          />
        )}
      </div>
    </div>
  );
};

export default BatchProgress;
