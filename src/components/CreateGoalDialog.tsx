import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  onCreated: () => void;
}

export const CreateGoalDialog = ({ open, onOpenChange, planId, onCreated }: CreateGoalDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetMetric, setTargetMetric] = useState("ai_score");
  const [targetValue, setTargetValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!title || !targetValue) {
      toast({
        title: "Missing information",
        description: "Please provide a goal title and target value",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('training_goals').insert({
        plan_id: planId,
        user_id: user.id,
        title,
        description,
        target_metric: targetMetric,
        target_value: parseFloat(targetValue),
        deadline: deadline || null,
      });

      if (error) throw error;

      toast({
        title: "Goal created!",
        description: "Your new training goal has been added",
      });

      setTitle("");
      setDescription("");
      setTargetValue("");
      setDeadline("");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Creation failed",
        description: "Could not create goal",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Training Goal</DialogTitle>
          <DialogDescription>
            Add a new goal to track your progress
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Goal Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Improve AI Score to 9.0"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you focus on?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="metric">Metric *</Label>
              <Select value={targetMetric} onValueChange={setTargetMetric}>
                <SelectTrigger id="metric">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_score">AI Score</SelectItem>
                  <SelectItem value="posture">Posture</SelectItem>
                  <SelectItem value="stability">Stability</SelectItem>
                  <SelectItem value="smoothness">Smoothness</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetValue">Target Value *</Label>
              <Input
                id="targetValue"
                type="number"
                step="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={targetMetric === 'ai_score' ? "9.0" : "90"}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deadline">Deadline (optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Goal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
