import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Target, TrendingUp, Award, Plus, Sparkles, Calendar, CheckCircle2, Users } from "lucide-react";
import { CreatePlanDialog } from "@/components/CreatePlanDialog";
import { CreateGoalDialog } from "@/components/CreateGoalDialog";
import { SharePlanDialog } from "@/components/SharePlanDialog";
import { format } from "date-fns";

interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface TrainingGoal {
  id: string;
  title: string;
  description: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  deadline: string;
  is_completed: boolean;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  achieved_at: string;
  milestone_type: string;
  value: number;
}

interface Recommendation {
  id: string;
  recommendation_text: string;
  recommendation_type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
}

export const TrainingPlanDashboard = () => {
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivePlan();
    fetchMilestones();
  }, []);

  useEffect(() => {
    if (activePlan) {
      fetchGoals();
      fetchRecommendations();
    }
  }, [activePlan]);

  const fetchActivePlan = async () => {
    const { data, error } = await supabase
      .from('training_plans')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching plan:', error);
      return;
    }

    setActivePlan(data);
  };

  const fetchGoals = async () => {
    if (!activePlan) return;

    const { data, error } = await supabase
      .from('training_goals')
      .select('*')
      .eq('plan_id', activePlan.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }

    setGoals(data || []);
  };

  const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from('training_milestones')
      .select('*')
      .order('achieved_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching milestones:', error);
      return;
    }

    setMilestones(data || []);
  };

  const fetchRecommendations = async () => {
    if (!activePlan) return;

    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('plan_id', activePlan.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recommendations:', error);
      return;
    }

    setRecommendations(data || []);
  };

  const generateRecommendations = async () => {
    if (!activePlan) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: { planId: activePlan.id }
      });

      if (error) throw error;

      toast({
        title: "Recommendations generated!",
        description: "AI has analyzed your progress and created personalized recommendations.",
      });

      fetchRecommendations();
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const markRecommendationRead = async (id: string) => {
    await supabase
      .from('ai_recommendations')
      .update({ is_read: true })
      .eq('id', id);
    
    fetchRecommendations();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'personal_best': return '🏆';
      case 'goal_completed': return '✅';
      case 'streak': return '🔥';
      case 'improvement': return '📈';
      default: return '⭐';
    }
  };

  if (!activePlan) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card variant="glass" className="border-primary/30 text-center p-12">
          <Target className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Create Your Training Plan</h2>
          <p className="text-muted-foreground mb-6">
            Start tracking your progress with personalized goals and AI-powered recommendations
          </p>
          <Button onClick={() => setShowCreatePlan(true)} size="lg" variant="hero">
            <Plus className="w-4 h-4 mr-2" />
            Create Training Plan
          </Button>
        </Card>
        <CreatePlanDialog
          open={showCreatePlan}
          onOpenChange={setShowCreatePlan}
          onCreated={fetchActivePlan}
        />
      </div>
    );
  }

  const completedGoals = goals.filter(g => g.is_completed).length;
  const totalGoals = goals.length;
  const overallProgress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Plan Header */}
      <Card variant="glass" className="border-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                {activePlan.name}
              </CardTitle>
              <p className="text-muted-foreground mt-2">{activePlan.description}</p>
              <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(activePlan.start_date), 'MMM d, yyyy')}
                </span>
                {activePlan.end_date && (
                  <span>→ {format(new Date(activePlan.end_date), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowShareDialog(true)} variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Share
              </Button>
              <Button onClick={() => setShowCreateGoal(true)} variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">
                {completedGoals} of {totalGoals} goals completed
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Goals */}
        <Card variant="glass" className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.filter(g => !g.is_completed).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No active goals</p>
              ) : (
                goals.filter(g => !g.is_completed).map(goal => (
                  <div key={goal.id} className="space-y-2 p-3 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{goal.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {goal.description}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {goal.target_metric}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>{goal.current_value} / {goal.target_value}</span>
                      </div>
                      <Progress 
                        value={(goal.current_value / goal.target_value) * 100} 
                        className="h-2"
                      />
                    </div>
                    {goal.deadline && (
                      <div className="text-xs text-muted-foreground">
                        Due: {format(new Date(goal.deadline), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Milestones */}
        <Card variant="glass" className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Recent Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No milestones yet</p>
              ) : (
                milestones.map(milestone => (
                  <div key={milestone.id} className="flex gap-3 p-3 rounded-lg border border-primary/20">
                    <div className="text-2xl">{getMilestoneIcon(milestone.milestone_type)}</div>
                    <div className="flex-1">
                      <div className="font-medium">{milestone.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {milestone.description}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(milestone.achieved_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card variant="glass" className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Recommendations
            </CardTitle>
            <Button
              onClick={generateRecommendations}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              {isGenerating ? "Generating..." : "Generate New"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No recommendations yet. Generate personalized insights based on your performance!
                </p>
                <Button onClick={generateRecommendations} disabled={isGenerating} variant="hero">
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate Recommendations"}
                </Button>
              </div>
            ) : (
              recommendations.map(rec => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-lg border transition-all ${
                    rec.is_read ? 'border-primary/10 bg-muted/30' : 'border-primary/30 bg-primary/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={getPriorityColor(rec.priority)}>
                      {rec.priority} priority
                    </Badge>
                    {!rec.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRecommendationRead(rec.id)}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm">{rec.recommendation_text}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {rec.recommendation_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(rec.created_at), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <CreateGoalDialog
        open={showCreateGoal}
        onOpenChange={setShowCreateGoal}
        planId={activePlan.id}
        onCreated={fetchGoals}
      />

      <SharePlanDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        planId={activePlan.id}
        planName={activePlan.name}
      />
    </div>
  );
};
