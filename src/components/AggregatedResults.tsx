import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Award } from "lucide-react";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface BatchAnalysisResult {
  fileName: string;
  videoUrl: string;
  aiScore: number;
  posture: number;
  stability: number;
  smoothness: number;
  createdAt: Date;
}

interface AggregatedResultsProps {
  results: BatchAnalysisResult[];
  onViewIndividual?: (result: BatchAnalysisResult) => void;
  onNewAnalysis: () => void;
}

export const AggregatedResults = ({ results, onViewIndividual, onNewAnalysis }: AggregatedResultsProps) => {
  const [sortBy, setSortBy] = useState<'aiScore' | 'posture' | 'stability' | 'smoothness'>('aiScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const totalFiles = results.length;
  const avgAiScore = results.reduce((sum, r) => sum + r.aiScore, 0) / totalFiles;
  const avgPosture = results.reduce((sum, r) => sum + r.posture, 0) / totalFiles;
  const avgStability = results.reduce((sum, r) => sum + r.stability, 0) / totalFiles;
  const avgSmoothness = results.reduce((sum, r) => sum + r.smoothness, 0) / totalFiles;

  const bestPerforming = results.reduce((best, current) =>
    current.aiScore > best.aiScore ? current : best
  , results[0]);

  const worstPerforming = results.reduce((worst, current) =>
    current.aiScore < worst.aiScore ? current : worst
  , results[0]);

  const sortedResults = [...results].sort((a, b) => {
    const multiplier = sortOrder === 'desc' ? -1 : 1;
    return (a[sortBy] - b[sortBy]) * multiplier;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 9) return { label: "Excellent", variant: "default" as const };
    if (score >= 7) return { label: "Good", variant: "secondary" as const };
    if (score >= 5) return { label: "Fair", variant: "outline" as const };
    return { label: "Needs Work", variant: "destructive" as const };
  };

  return (
    <div className="space-y-6 p-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">
              {totalFiles}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Files processed</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-primary/30 glow-blue">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average AI Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold gradient-text">
              {avgAiScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">out of 10</p>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-green-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              Best Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bestPerforming.aiScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {bestPerforming.fileName}
            </p>
          </CardContent>
        </Card>

        <Card variant="glass" className="border-orange-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              Needs Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {worstPerforming.aiScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {worstPerforming.fileName}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Average Metrics */}
      <Card variant="glass" className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Average Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {avgPosture.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">🎯 Posture</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {avgStability.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">⚖️ Stability</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {avgSmoothness.toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">🌊 Smoothness</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Results Table */}
      <Card variant="glass" className="border-primary/30">
        <CardHeader>
          <CardTitle>Individual Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleSort('aiScore')}
                  >
                    AI Score {sortBy === 'aiScore' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleSort('posture')}
                  >
                    Posture {sortBy === 'posture' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleSort('stability')}
                  >
                    Stability {sortBy === 'stability' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleSort('smoothness')}
                  >
                    Smoothness {sortBy === 'smoothness' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResults.map((result, index) => {
                  const badge = getScoreBadge(result.aiScore);
                  return (
                    <TableRow 
                      key={index}
                      className={onViewIndividual ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => onViewIndividual?.(result)}
                    >
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {result.fileName}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">
                          {result.aiScore.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell>{result.posture}%</TableCell>
                      <TableCell>{result.stability}%</TableCell>
                      <TableCell>{result.smoothness}%</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant} className="text-xs">
                          {badge.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onNewAnalysis} variant="hero" className="w-full" size="lg">
        Analyze More Routines
      </Button>
    </div>
  );
};
