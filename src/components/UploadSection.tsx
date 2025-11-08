import { Upload, Video, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRef } from "react";

interface UploadSectionProps {
  onVideoSelect: (file: File) => void;
  onImageSelect?: (file: File) => void;
  isProcessing: boolean;
}

export const UploadSection = ({ onVideoSelect, onImageSelect, isProcessing }: UploadSectionProps) => {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      onVideoSelect(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/") && onImageSelect) {
      onImageSelect(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-6 glow-blue">
          <Video className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-3 gradient-text">
          FlipCoach AI
        </h1>
        <p className="text-foreground/70 text-lg max-w-md mx-auto">
          Upload your gymnastics routine and get instant AI-powered analysis and coaching feedback
        </p>
      </div>

      <Tabs defaultValue="video" className="max-w-md w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 glass-card">
          <TabsTrigger value="video">Video Upload</TabsTrigger>
          <TabsTrigger value="image">Image Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="video">
          <Card variant="glass" className="p-12 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 w-full hover:glow-blue">
            <div className="flex flex-col items-center space-y-4">
              <Video className="w-16 h-16 text-primary/60" />
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Upload Video</p>
                <p className="text-xs text-muted-foreground">Max 20 seconds • MP4, WebM, MOV</p>
              </div>
              <Button
                onClick={() => videoInputRef.current?.click()}
                disabled={isProcessing}
                size="lg"
                variant="hero"
              >
                {isProcessing ? "Processing..." : "Choose Video"}
              </Button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="image">
          <Card variant="glass" className="p-12 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 w-full hover:glow-blue">
            <div className="flex flex-col items-center space-y-4">
              <Image className="w-16 h-16 text-primary/60" />
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Upload Image</p>
                <p className="text-xs text-muted-foreground">JPG, PNG, WebP</p>
              </div>
              <Button
                onClick={() => imageInputRef.current?.click()}
                disabled={isProcessing}
                size="lg"
                variant="hero"
              >
                {isProcessing ? "Processing..." : "Choose Image"}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl w-full">
        {[
          { label: "Posture Analysis", icon: "🎯" },
          { label: "Landing Stability", icon: "⚖️" },
          { label: "Motion Smoothness", icon: "🌊" },
        ].map((feature) => (
          <div key={feature.label} className="text-center glass-card p-4 rounded-lg border border-primary/20 hover:border-primary/40 transition-all">
            <div className="text-3xl mb-2">{feature.icon}</div>
            <p className="text-sm font-medium text-foreground/80">{feature.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
