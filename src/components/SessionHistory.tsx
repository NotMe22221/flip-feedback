import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface Session {
  id: string;
  created_at: string;
  ai_score: number;
  posture_score: number;
  stability_score: number;
  smoothness_score: number;
}

interface SessionHistoryProps {
  sessions: Session[];
}

export const SessionHistory = ({ sessions }: SessionHistoryProps) => {
  const getScoreBadge = (score: number) => {
    if (score >= 9) return { label: "Excellent", variant: "default" as const };
    if (score >= 7) return { label: "Good", variant: "secondary" as const };
    if (score >= 5) return { label: "Fair", variant: "outline" as const };
    return { label: "Needs Work", variant: "destructive" as const };
  };

  const calculateImprovement = () => {
    if (sessions.length < 2) return null;
    const latest = sessions[0].ai_score;
    const previous = sessions[1].ai_score;
    const change = latest - previous;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0,
    };
  };

  const improvement = calculateImprovement();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6 shadow-lg border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-600/10">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {improvement && (
            <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-blue-600/5 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${improvement.isPositive ? 'text-green-600' : 'text-orange-600'}`} />
                <span className="font-medium">
                  {improvement.isPositive ? 'Improved' : 'Changed'} by {improvement.value} points since last session
                </span>
              </div>
            </div>
          )}

          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sessions yet. Upload your first routine to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => {
                const badge = getScoreBadge(session.ai_score);
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-blue-600/20">
                        <div className="text-2xl font-bold text-primary">
                          {session.ai_score.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <div>
                        <div className="font-medium mb-1">
                          {format(new Date(session.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Posture: {session.posture_score}%</span>
                          <span>•</span>
                          <span>Stability: {session.stability_score}%</span>
                          <span>•</span>
                          <span>Smoothness: {session.smoothness_score}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {index === 0 && <Badge variant="outline" className="border-primary text-primary">Latest</Badge>}
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
