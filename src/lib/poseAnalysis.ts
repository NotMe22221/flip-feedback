// Pose analysis utilities for gymnastics routine evaluation
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

export interface PoseKeypoint {
  x: number;
  y: number;
  z?: number;
  score: number;
  name: string;
}

export interface AnalysisResult {
  aiScore: number;
  posture: number;
  stability: number;
  smoothness: number;
  feedback: string[];
  avgKneeAngle: number;
  avgHipAngle: number;
  landingStability: number;
}

// MediaPipe Pose landmark indices - All 33 landmarks
const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

// Calculate angle between three points
const calculateAngle = (p1: PoseKeypoint, p2: PoseKeypoint, p3: PoseKeypoint): number => {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
};

// Analyze pose keypoints and generate scores
export const analyzePose = (keypointsData: PoseKeypoint[][]): AnalysisResult => {
  // Reference values for ideal gymnastics form
  const IDEAL_KNEE_ANGLE = 170; // Nearly straight legs
  const IDEAL_HIP_ANGLE = 175;
  const MAX_KNEE_DEVIATION = 35;
  
  let totalKneeAngle = 0;
  let totalHipAngle = 0;
  let validFrames = 0;
  let postureDeviations = 0;
  let stabilityScore = 0;
  
  const feedback: string[] = [];

  // Process each frame
  keypointsData.forEach((keypoints, frameIndex) => {
    // Find key body points by name
    const leftHip = keypoints.find(kp => kp.name === 'left_hip');
    const leftKnee = keypoints.find(kp => kp.name === 'left_knee');
    const leftAnkle = keypoints.find(kp => kp.name === 'left_ankle');
    const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');

    if (leftHip && leftKnee && leftAnkle && leftShoulder && 
        leftHip.score > 0.5 && leftKnee.score > 0.5 && leftAnkle.score > 0.5) {
      
      validFrames++;
      
      // Calculate knee angle
      const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
      totalKneeAngle += kneeAngle;
      
      // Calculate hip angle (simplified)
      const hipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
      totalHipAngle += hipAngle;
      
      // Check for deviations
      if (Math.abs(kneeAngle - IDEAL_KNEE_ANGLE) > MAX_KNEE_DEVIATION) {
        postureDeviations++;
      }
      
      // Simple stability check (check if body is balanced)
      const bodyBalance = Math.abs(leftHip.x - leftAnkle.x);
      if (bodyBalance < 0.1) {
        stabilityScore++;
      }
    }
  });

  // Calculate averages
  const avgKneeAngle = validFrames > 0 ? totalKneeAngle / validFrames : 0;
  const avgHipAngle = validFrames > 0 ? totalHipAngle / validFrames : 0;
  const landingStability = validFrames > 0 ? (stabilityScore / validFrames) * 100 : 0;

  // Calculate scores
  const kneeScore = Math.max(0, 100 - Math.abs(avgKneeAngle - IDEAL_KNEE_ANGLE) * 2);
  const hipScore = Math.max(0, 100 - Math.abs(avgHipAngle - IDEAL_HIP_ANGLE) * 2);
  const postureScore = Math.round((kneeScore + hipScore) / 2);
  
  const stabilityPercentage = Math.round(landingStability);
  const smoothnessScore = Math.round(Math.max(0, 100 - (postureDeviations / validFrames) * 100));

  // Generate feedback
  if (avgKneeAngle < IDEAL_KNEE_ANGLE - 20) {
    feedback.push(`Knee bend averaged ${avgKneeAngle.toFixed(1)}° – try to keep legs straighter during jumps for better form.`);
  } else {
    feedback.push(`Good leg extension! Knee angles are well maintained.`);
  }

  if (stabilityPercentage > 70) {
    feedback.push(`Excellent landing stability – body alignment is balanced throughout.`);
  } else {
    feedback.push(`Work on landing stability – focus on keeping your center of gravity aligned over your feet.`);
  }

  if (smoothnessScore > 75) {
    feedback.push(`Smooth transitions detected – great flow between movements!`);
  } else {
    feedback.push(`Practice smoother transitions between elements to improve overall flow.`);
  }

  if (postureScore > 80) {
    feedback.push(`Outstanding posture control throughout the routine!`);
  }

  // Calculate final AI score (weighted average)
  const aiScore = (
    postureScore * 0.4 +
    stabilityPercentage * 0.3 +
    smoothnessScore * 0.3
  ) / 10;

  return {
    aiScore: Math.round(aiScore * 10) / 10,
    posture: Math.round(postureScore),
    stability: Math.round(stabilityPercentage),
    smoothness: Math.round(smoothnessScore),
    feedback,
    avgKneeAngle,
    avgHipAngle,
    landingStability,
  };
};

let poseLandmarker: PoseLandmarker | null = null;

// Initialize MediaPipe Pose
export const initializePoseLandmarker = async (): Promise<PoseLandmarker> => {
  if (poseLandmarker) return poseLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  return poseLandmarker;
};

// Real pose detection using MediaPipe
export const detectPoseInVideo = async (
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<PoseKeypoint[][]> => {
  const landmarker = await initializePoseLandmarker();
  
  // Create video element
  const video = document.createElement("video");
  video.src = URL.createObjectURL(videoFile);
  video.muted = true;
  
  await new Promise((resolve) => {
    video.onloadedmetadata = resolve;
  });

  const allKeypoints: PoseKeypoint[][] = [];
  const fps = 15; // Process at 15 fps to save compute
  const frameDuration = 1000 / fps;
  const totalFrames = Math.floor((video.duration * fps));
  
  return new Promise((resolve, reject) => {
    let currentFrame = 0;
    
    video.ontimeupdate = () => {
      if (video.currentTime >= video.duration) {
        URL.revokeObjectURL(video.src);
        resolve(allKeypoints);
        return;
      }

      try {
        const result = landmarker.detectForVideo(video, performance.now());
        
        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0];
          // Extract all 33 landmarks
          const frameKeypoints: PoseKeypoint[] = Object.entries(POSE_LANDMARKS).map(([name, index]) => ({
            x: landmarks[index].x,
            y: landmarks[index].y,
            z: landmarks[index].z,
            score: landmarks[index].visibility || 1,
            name: name.toLowerCase(),
          }));
          
          allKeypoints.push(frameKeypoints);
        }

        currentFrame++;
        if (onProgress) {
          onProgress(Math.round((currentFrame / totalFrames) * 100));
        }

        // Move to next frame
        video.currentTime = Math.min(video.currentTime + (1 / fps), video.duration);
      } catch (error) {
        console.error("Error detecting pose:", error);
        video.currentTime = Math.min(video.currentTime + (1 / fps), video.duration);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video"));
    };

    // Start processing
    video.currentTime = 0;
    video.play().catch(reject);
  });
};

// Detect pose in a static image
export const detectPoseInImage = async (imageFile: File): Promise<PoseKeypoint[]> => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  const imageLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
      delegate: "GPU",
    },
    runningMode: "IMAGE",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
  });

  // Create image element
  const img = document.createElement("img");
  img.src = URL.createObjectURL(imageFile);
  
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const result = imageLandmarker.detect(img);
  URL.revokeObjectURL(img.src);

  if (result.landmarks && result.landmarks.length > 0) {
    const landmarks = result.landmarks[0];
    // Extract all 33 landmarks
    return Object.entries(POSE_LANDMARKS).map(([name, index]) => ({
      x: landmarks[index].x,
      y: landmarks[index].y,
      z: landmarks[index].z,
      score: landmarks[index].visibility || 1,
      name: name.toLowerCase(),
    }));
  }

  return [];
};
