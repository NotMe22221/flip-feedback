import { useEffect, useRef } from "react";
import { PoseKeypoint } from "@/lib/poseAnalysis";

interface SkeletonImageViewerProps {
  imageUrl: string;
  keypoints: PoseKeypoint[];
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

export const SkeletonImageViewer = ({ 
  imageUrl, 
  keypoints,
  className = "" 
}: SkeletonImageViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const drawSkeleton = (keypoints: PoseKeypoint[], canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw the image first
    ctx.drawImage(img, 0, 0);

    // Draw connections (skeleton lines) with confidence-based coloring
    ctx.lineWidth = 4;
    
    POSE_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = keypoints.find(kp => kp.name === start);
      const endPoint = keypoints.find(kp => kp.name === end);
      
      if (startPoint && endPoint && startPoint.score > 0.3 && endPoint.score > 0.3) {
        const avgScore = (startPoint.score + endPoint.score) / 2;
        
        // Confidence-based color: green (high) -> yellow (medium) -> red (low)
        if (avgScore > 0.7) {
          ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)'; // Green
        } else if (avgScore > 0.5) {
          ctx.strokeStyle = 'rgba(234, 179, 8, 0.9)'; // Yellow
        } else {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red
        }
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
        ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
        ctx.stroke();
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
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw inner circle (point)
        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img || !keypoints.length) return;

    const handleImageLoad = () => {
      drawSkeleton(keypoints, canvas, img);
    };

    if (img.complete) {
      handleImageLoad();
    } else {
      img.addEventListener('load', handleImageLoad);
      return () => img.removeEventListener('load', handleImageLoad);
    }
  }, [keypoints, imageUrl]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative bg-black rounded-lg overflow-hidden">
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Pose analysis"
          className="hidden"
        />
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};
