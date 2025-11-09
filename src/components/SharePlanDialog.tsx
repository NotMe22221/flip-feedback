import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, X, Mail, Eye, Edit } from "lucide-react";

interface SharePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planName: string;
}

interface Share {
  id: string;
  shared_with_email: string;
  permission_level: string;
  accepted: boolean;
  created_at: string;
}

export const SharePlanDialog = ({ open, onOpenChange, planId, planName }: SharePlanDialogProps) => {
  const [email, setEmail] = useState("");
  const [permissionLevel, setPermissionLevel] = useState("view");
  const [shares, setShares] = useState<Share[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchShares();
    }
  }, [open, planId]);

  const fetchShares = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('plan_shares')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      console.error('Error fetching shares:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    try {
      const { error } = await supabase.functions.invoke('share-plan', {
        body: {
          planId,
          email: email.toLowerCase().trim(),
          permissionLevel,
        }
      });

      if (error) throw error;

      toast({
        title: "Invitation sent!",
        description: `Sent collaboration invitation to ${email}`,
      });

      setEmail("");
      setPermissionLevel("view");
      fetchShares();
    } catch (error) {
      console.error('Error sharing plan:', error);
      toast({
        title: "Sharing failed",
        description: error instanceof Error ? error.message : "Could not share plan",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('plan_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Access removed",
        description: "Collaborator access has been revoked",
      });

      fetchShares();
    } catch (error) {
      console.error('Error removing share:', error);
      toast({
        title: "Removal failed",
        description: "Could not remove access",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Share Training Plan
          </DialogTitle>
          <DialogDescription>
            Collaborate with coaches and training partners on "{planName}"
          </DialogDescription>
        </DialogHeader>

        {/* Add Collaborator Form */}
        <div className="space-y-4 border-b pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@example.com"
                  className="pl-9"
                  onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="permission">Permission Level</Label>
              <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                <SelectTrigger id="permission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Only
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Can Edit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleShare} disabled={isSharing} className="w-full">
            {isSharing ? "Sending invitation..." : "Send Invitation"}
          </Button>
        </div>

        {/* Current Collaborators */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Collaborators ({shares.length})
          </h3>
          
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : shares.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No collaborators yet. Share this plan to start collaborating!
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-all"
                >
                  <div className="flex-1">
                    <div className="font-medium">{share.shared_with_email}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={share.permission_level === 'edit' ? 'default' : 'secondary'} className="text-xs">
                        {share.permission_level === 'edit' ? (
                          <><Edit className="w-3 h-3 mr-1" />Can Edit</>
                        ) : (
                          <><Eye className="w-3 h-3 mr-1" />View Only</>
                        )}
                      </Badge>
                      <Badge variant={share.accepted ? 'outline' : 'secondary'} className="text-xs">
                        {share.accepted ? '✓ Accepted' : '⏳ Pending'}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveShare(share.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          💡 <strong>Tip:</strong> Collaborators with "Can Edit" permission can add goals and update progress. "View Only" collaborators can see everything but cannot make changes.
        </div>
      </DialogContent>
    </Dialog>
  );
};
