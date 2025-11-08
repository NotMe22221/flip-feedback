/**
 * Extract frames from a video file at specified intervals
 */
export const extractFramesFromVideo = async (
  file: File,
  numberOfFrames: number = 5
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    
    const frames: string[] = [];
    let currentFrameIndex = 0;
    
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const interval = duration / (numberOfFrames + 1);
      
      const captureFrame = () => {
        if (currentFrameIndex >= numberOfFrames) {
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }
        
        const targetTime = interval * (currentFrameIndex + 1);
        video.currentTime = targetTime;
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        frames.push(frameData);
        
        currentFrameIndex++;
        captureFrame();
      };
      
      captureFrame();
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Convert an image file to base64
 */
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};
