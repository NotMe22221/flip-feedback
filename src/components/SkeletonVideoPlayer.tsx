import { useEffect, useRef, useState } from "react";
import { PoseKeypoint } from "@/lib/poseAnalysis";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface SkeletonVideoPlayerProps {
  videoUrl: string;
  keypointsData: PoseKeypoint[][];
  className?: string;
}

// Pose connections for drawing complete skeleton (33 landmarks)
const POSE_CONNECTIONS = [
  // Face
  ['nose', 'left_eye_inner'],
  ['left_eye_inner', 'left_eye'],
  ['left_eye', 'left_eye_outer'],
  ['left_eye_outer', 'left_ear'],
  ['nose', 'right_eye_inner'],
  ['right_eye_inner', 'right_eye'],
  ['right_eye', 'right_eye_outer'],
  ['right_eye_outer', 'right_ear'],
  ['mouth_left', 'mouth_right'],
  
  // Torso
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  
  // Arms
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['left_wrist', 'left_thumb'],
  ['left_wrist', 'left_index'],
  ['left_wrist', 'left_pinky'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['right_wrist', 'right_thumb'],
  ['right_wrist', 'right_index'],
  ['right_wrist', 'right_pinky'],
  
  // Legs
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['left_ankle', 'left_heel'],
  ['left_ankle', 'left_foot_index'],
  ['left_heel', 'left_foot_index'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['right_ankle', 'right_heel'],
  ['right_ankle', 'right_foot_index'],
  ['right_heel', 'right_foot_index'],
];

export const SkeletonVideoPlayer = ({ 
  videoUrl, 
  keypointsData,
  className = "" 
}: SkeletonVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef<number>();
  const FPS = 15; // MediaPipe detection FPS

  // Interpolate between two keypoint frames for smooth animation
  const interpolateKeypoints = (
    frame1: PoseKeypoint[], 
    frame2: PoseKeypoint[], 
    factor: number
  ): PoseKeypoint[] => {
    return frame1.map((kp1, index) => {
      const kp2 = frame2[index];
      return {
        ...kp1,
        x: kp1.x + (kp2.x - kp1.x) * factor,
        y: kp1.y + (kp2.y - kp1.y) * factor,
        z: kp1.z + (kp2.z - kp1.z) * factor,
        score: kp1.score + (kp2.score - kp1.score) * factor,
      };
    });
  };

  const drawSkeleton = (keypoints: PoseKeypoint[], canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Draw connections (skeleton lines) with confidence-based coloring
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    POSE_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = keypoints.find(kp => kp.name === start);
      const endPoint = keypoints.find(kp => kp.name === end);
      
      if (startPoint && endPoint && startPoint.score > 0.3 && endPoint.score > 0.3) {
        const avgScore = (startPoint.score + endPoint.score) / 2;
        
        // Confidence-based color: green (high) -> yellow (medium) -> red (low)
        let strokeColor;
        if (avgScore > 0.7) {
          strokeColor = 'rgba(34, 197, 94, 0.95)'; // Green
        } else if (avgScore > 0.5) {
          strokeColor = 'rgba(234, 179, 8, 0.95)'; // Yellow
        } else {
          strokeColor = 'rgba(239, 68, 68, 0.9)'; // Red
        }
        
        // Draw shadow/glow for depth
        ctx.shadowBlur = 8;
        ctx.shadowColor = strokeColor;
        
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowBlur = 0;
      }
    });

    // Draw keypoints (joints) with confidence-based colors
    keypoints.forEach((point) => {
      if (point.score > 0.3) {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        
        // Confidence-based color
        let glowColor, pointColor;
        if (point.score > 0.7) {
          glowColor = 'rgba(34, 197, 94, 0.4)'; // Green glow
          pointColor = 'rgb(34, 197, 94)'; // Green
        } else if (point.score > 0.5) {
          glowColor = 'rgba(234, 179, 8, 0.4)'; // Yellow glow
          pointColor = 'rgb(234, 179, 8)'; // Yellow
        } else {
          glowColor = 'rgba(239, 68, 68, 0.3)'; // Red glow
          pointColor = 'rgb(239, 68, 68)'; // Red
        }
        
        // Draw outer circle (glow)
        ctx.shadowBlur = 12;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw inner circle (point)
        ctx.shadowBlur = 6;
        ctx.shadowColor = pointColor;
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
      }
    });
  };

  const updateCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !keypointsData.length) return;

    // Calculate exact frame position with interpolation factor
    const exactFrameIndex = video.currentTime * FPS;
    const frameIndex = Math.floor(exactFrameIndex);
    const nextFrameIndex = Math.min(frameIndex + 1, keypointsData.length - 1);
    const interpolationFactor = exactFrameIndex - frameIndex; // 0 to 1
    
    if (frameIndex < keypointsData.length) {
      const currentFrame = keypointsData[frameIndex];
      const nextFrame = keypointsData[nextFrameIndex];
      
      // Interpolate between frames for smooth 60 FPS motion from 15 FPS data
      const interpolatedFrame = frameIndex === nextFrameIndex 
        ? currentFrame 
        : interpolateKeypoints(currentFrame, nextFrame, interpolationFactor);
      
      drawSkeleton(interpolatedFrame, canvas, video);
    }

    // Continue animation loop during playback
    if (!video.paused && !video.ended) {
      animationFrameRef.current = requestAnimationFrame(updateCanvas);
    }
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      updateCanvas();
    } else {
      video.pause();
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleLoadedMetadata = () => {
      // Draw initial frame when video loads
      updateCanvas();
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [keypointsData]);

  // Separate effect for continuous canvas updates during playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start continuous updates when playing
    if (isPlaying && !video.paused && !video.ended) {
      updateCanvas();
    }
  }, [isPlaying]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <Button
          onClick={handlePlayPause}
          size="lg"
          className="shadow-lg bg-primary/90 hover:bg-primary"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};
