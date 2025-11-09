import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Loader2, XCircle, X } from "lucide-react";

export interface BatchFileStatus {
  file: File;
  status: 'waiting' | 'processing' | 'complete' | 'failed';
  progress?: number;
  aiScore?: number;
  error?: string;
}

interface BatchUploadProgressProps {
  batchProgress: Map<string, BatchFileStatus>;
  onCancel: () => void;
}

export const BatchUploadProgress = ({ batchProgress, onCancel }: BatchUploadProgressProps) => {
  const files = Array.from(batchProgress.values());
  const totalFiles = files.length;
  const completedFiles = files.filter(f => f.status === 'complete' || f.status === 'failed').length;
  const overallProgress = (completedFiles / totalFiles) * 100;

  const getStatusIcon = (status: BatchFileStatus['status']) => {
    switch (status) {
      case 'waiting':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: BatchFileStatus['status']) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline">Waiting</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing...</Badge>;
      case 'complete':
        return <Badge variant="default">Complete</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <Card variant="glass" className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Batch Processing Progress</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Processing {completedFiles} of {totalFiles} files
            </span>
            <span className="text-sm text-muted-foreground">
              {overallProgress.toFixed(0)}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {files.map((fileStatus, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(fileStatus.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {fileStatus.file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(fileStatus.file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  {fileStatus.status === 'processing' && fileStatus.progress !== undefined && (
                    <Progress value={fileStatus.progress} className="h-1 mt-1" />
                  )}
                  {fileStatus.status === 'failed' && fileStatus.error && (
                    <div className="text-xs text-destructive mt-1">
                      {fileStatus.error}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {fileStatus.status === 'complete' && fileStatus.aiScore !== undefined && (
                  <Badge variant="outline" className="font-bold">
                    {fileStatus.aiScore.toFixed(1)}
                  </Badge>
                )}
                {getStatusBadge(fileStatus.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
