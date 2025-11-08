import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonVideoPlayer } from "@/components/SkeletonVideoPlayer";
import { VoiceCoach } from "@/components/VoiceCoach";
import { PoseKeypoint } from "@/lib/poseAnalysis";

interface AnalysisResultsProps {
  videoUrl: string;
  keypointsData: PoseKeypoint[][];
  scores: {
    aiScore: number;
    posture: number;
    stability: number;
    smoothness: number;
  };
  feedback: string[];
  onNewAnalysis: () => void;
}

export const AnalysisResults = ({ videoUrl, keypointsData, scores, feedback, onNewAnalysis }: AnalysisResultsProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 9) return { label: "Excellent", variant: "default" as const };
    if (score >= 7) return { label: "Good", variant: "secondary" as const };
    if (score >= 5) return { label: "Fair", variant: "outline" as const };
    return { label: "Needs Work", variant: "destructive" as const };
  };

  const badge = getScoreBadge(scores.aiScore);

  return (
    <div className="grid lg:grid-cols-2 gap-6 p-6">
      {/* Video Preview with Skeleton Overlay */}
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-600/10">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Analyzed Routine with Pose Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <SkeletonVideoPlayer 
            videoUrl={videoUrl} 
            keypointsData={keypointsData}
            className="w-full aspect-video"
          />
        </CardContent>
      </Card>

      {/* Scores & Feedback */}
      <div className="space-y-6">
        {/* AI Score */}
        <Card className="shadow-lg border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>AI Performance Score</CardTitle>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                {scores.aiScore.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground">out of 10</p>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Metrics */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Detailed Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Posture Quality", value: scores.posture, icon: "🎯" },
              { label: "Landing Stability", value: scores.stability, icon: "⚖️" },
              { label: "Motion Smoothness", value: scores.smoothness, icon: "🌊" },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <span>{metric.icon}</span>
                    {metric.label}
                  </span>
                  <span className={`text-sm font-bold ${getScoreColor(metric.value)}`}>
                    {metric.value}%
                  </span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Coaching Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {feedback.map((item, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="text-primary font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Voice Coach */}
        <VoiceCoach scores={scores} feedback={feedback} />

        <Button onClick={onNewAnalysis} className="w-full" size="lg">
          Analyze Another Routine
        </Button>
      </div>
    </div>
  );
};
