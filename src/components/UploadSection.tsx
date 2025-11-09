import { Upload, Video, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface UploadSectionProps {
  onVideoSelect: (file: File) => void;
  onImageSelect?: (file: File) => void;
  onBatchSelect?: (files: File[]) => void;
  isProcessing: boolean;
}

export const UploadSection = ({ onVideoSelect, onImageSelect, onBatchSelect, isProcessing }: UploadSectionProps) => {
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const batchVideoInputRef = useRef<HTMLInputElement>(null);
  const batchImageInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<'single' | 'batch'>('single');

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

  const handleBatchVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFiles = files.filter(f => f.type.startsWith("video/"));
    setSelectedFiles(videoFiles);
    setUploadMode('batch');
  };

  const handleBatchImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    setSelectedFiles(imageFiles);
    setUploadMode('batch');
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcessBatch = () => {
    if (selectedFiles.length > 0 && onBatchSelect) {
      onBatchSelect(selectedFiles);
      setSelectedFiles([]);
      setUploadMode('single');
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setUploadMode('single');
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

      {selectedFiles.length > 0 && uploadMode === 'batch' ? (
        <div className="max-w-2xl w-full">
          <Card variant="glass" className="p-6 border-primary/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-lg px-3 py-1">
                  {selectedFiles.length} files selected
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-primary/20 hover:border-primary/40 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              onClick={handleProcessBatch}
              disabled={isProcessing}
              size="lg"
              variant="hero"
              className="w-full"
            >
              {isProcessing ? "Processing..." : `Process All ${selectedFiles.length} Files`}
            </Button>
          </Card>
        </div>
      ) : (
        <Tabs defaultValue="video" className="max-w-md w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 glass-card">
            <TabsTrigger value="video">Single Upload</TabsTrigger>
            <TabsTrigger value="image">Batch Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="video">
            <Card variant="glass" className="p-12 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 w-full hover:glow-blue">
              <div className="flex flex-col items-center space-y-4">
                <Video className="w-16 h-16 text-primary/60" />
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">Single Video Upload</p>
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
                <div className="w-full pt-4 mt-4 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground text-center mb-2">OR</p>
                  <Button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isProcessing}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    Single Image Upload
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="image">
            <Card variant="glass" className="p-12 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 w-full hover:glow-blue">
              <div className="flex flex-col items-center space-y-4">
                <Upload className="w-16 h-16 text-primary/60" />
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">Batch Upload</p>
                  <p className="text-xs text-muted-foreground">Select multiple videos or images</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => batchVideoInputRef.current?.click()}
                    disabled={isProcessing}
                    size="lg"
                    variant="hero"
                  >
                    Select Videos
                  </Button>
                  <Button
                    onClick={() => batchImageInputRef.current?.click()}
                    disabled={isProcessing}
                    size="lg"
                    variant="outline"
                  >
                    Select Images
                  </Button>
                </div>
                <input
                  ref={batchVideoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleBatchVideoChange}
                  className="hidden"
                />
                <input
                  ref={batchImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBatchImageChange}
                  className="hidden"
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

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
