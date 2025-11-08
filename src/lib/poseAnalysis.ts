// Pose analysis utilities for gymnastics routine evaluation

export interface PoseKeypoint {
  x: number;
  y: number;
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
    // Find key body points (simplified indices - adjust based on actual model)
    const leftHip = keypoints.find(kp => kp.name.includes('left_hip'));
    const leftKnee = keypoints.find(kp => kp.name.includes('left_knee'));
    const leftAnkle = keypoints.find(kp => kp.name.includes('left_ankle'));
    const leftShoulder = keypoints.find(kp => kp.name.includes('left_shoulder'));

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

// Mock pose detection for demo purposes
// In production, this would use MediaPipe Pose or similar
export const detectPoseInVideo = async (videoFile: File): Promise<PoseKeypoint[][]> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock keypoints (in production, use real pose detection)
  const mockKeypoints: PoseKeypoint[][] = [];
  const numFrames = 30; // ~2 seconds at 15fps
  
  for (let i = 0; i < numFrames; i++) {
    const frame: PoseKeypoint[] = [
      { x: 0.5, y: 0.2, score: 0.9, name: 'left_shoulder' },
      { x: 0.5, y: 0.5, score: 0.95, name: 'left_hip' },
      { x: 0.5 + (Math.random() - 0.5) * 0.1, y: 0.7, score: 0.9, name: 'left_knee' },
      { x: 0.5, y: 0.9, score: 0.85, name: 'left_ankle' },
    ];
    mockKeypoints.push(frame);
  }
  
  return mockKeypoints;
};
