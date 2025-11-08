import { useEffect, useRef, useState } from "react";
import { PoseKeypoint } from "@/lib/poseAnalysis";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface SkeletonVideoPlayerProps {
  videoUrl: string;
  keypointsData: PoseKeypoint[][];
  className?: string;
}

// Pose connections for drawing skeleton
const POSE_CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_hip'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_hip'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
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

    // Draw connections (skeleton lines)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Blue
    ctx.lineWidth = 3;
    
    POSE_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = keypoints.find(kp => kp.name === start);
      const endPoint = keypoints.find(kp => kp.name === end);
      
      if (startPoint && endPoint && startPoint.score > 0.5 && endPoint.score > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw keypoints (joints)
    keypoints.forEach((point) => {
      if (point.score > 0.5) {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        
        // Draw outer circle (glow)
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw inner circle (point)
        ctx.fillStyle = 'rgb(59, 130, 246)';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  const updateCanvas = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !keypointsData.length) return;

    // Calculate which frame to show based on video time
    const fps = 15;
    const frameIndex = Math.floor(video.currentTime * fps);
    
    if (frameIndex < keypointsData.length) {
      drawSkeleton(keypointsData[frameIndex], canvas, video);
    }

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

    const handleTimeUpdate = () => {
      if (!isPlaying) {
        updateCanvas();
      }
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, keypointsData]);

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
