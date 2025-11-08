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
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-600 mb-6 shadow-lg">
          <Video className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          FlipCoach AI
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Upload your gymnastics routine and get instant AI-powered analysis and coaching feedback
        </p>
      </div>

      <Tabs defaultValue="video" className="max-w-md w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="video">Video Upload</TabsTrigger>
          <TabsTrigger value="image">Image Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="video">
          <Card className="p-12 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 w-full bg-gradient-to-br from-background to-primary/5">
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
                className="bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg transition-all duration-300"
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
          <Card className="p-12 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 w-full bg-gradient-to-br from-background to-primary/5">
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
                className="bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg transition-all duration-300"
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
          <div key={feature.label} className="text-center">
            <div className="text-3xl mb-2">{feature.icon}</div>
            <p className="text-sm font-medium text-muted-foreground">{feature.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
