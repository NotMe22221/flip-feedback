import { useConversation } from "@11labs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceCoachProps {
  scores: {
    aiScore: number;
    posture: number;
    stability: number;
    smoothness: number;
  };
  feedback: string[];
}

export const VoiceCoach = ({ scores, feedback }: VoiceCoachProps) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate coaching context for the agent
  const coachingContext = `
Current Performance Analysis:
- AI Score: ${scores.aiScore}/10
- Posture Quality: ${scores.posture}%
- Landing Stability: ${scores.stability}%
- Motion Smoothness: ${scores.smoothness}%

Coaching Feedback:
${feedback.map((item, i) => `${i + 1}. ${item}`).join('\n')}
  `.trim();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Voice coach connected");
      toast({
        title: "Voice Coach Connected",
        description: "Start speaking to discuss your performance!",
      });
    },
    onDisconnect: () => {
      console.log("Voice coach disconnected");
    },
    onError: (error) => {
      console.error("Voice coach error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to voice coach. Please try again.",
        variant: "destructive",
      });
    },
    onMessage: (message) => {
      console.log("Voice coach message:", message);
    },
    overrides: {
      agent: {
        prompt: {
          prompt: `You are an expert gymnastics coach providing personalized feedback. 
You have just analyzed a routine and here are the results:

${coachingContext}

Your role:
- Discuss the performance metrics in an encouraging, constructive way
- Answer questions about the analysis and scores
- Provide specific tips for improvement based on the feedback
- Help the gymnast understand what the scores mean
- Motivate and guide them toward better performance

Be conversational, supportive, and knowledgeable. Keep responses concise but helpful.`,
        },
        firstMessage: `Hey there! I've just finished analyzing your routine and I'm impressed! You scored ${scores.aiScore} out of 10. Want to talk about your performance and how you can improve?`,
        language: "en",
      },
      tts: {
        voiceId: "9BWtsMINqrJLrRacOk9x", // Aria - professional and clear
      },
    },
  });

  // Get signed URL for the agent
  const initializeVoiceCoach = async () => {
    setIsInitializing(true);
    
    try {
      // Replace with your actual agent ID from ElevenLabs UI
      // Create agent at: https://elevenlabs.io/app/conversational-ai
      const agentId = "YOUR_AGENT_ID"; 
      
      // Get signed URL from backend
      const { data, error } = await supabase.functions.invoke('elevenlabs-signed-url', {
        body: { agentId },
      });
      
      if (error) {
        console.error("Failed to get signed URL:", error);
        throw new Error("Failed to get signed URL. Make sure you've created an ElevenLabs agent and updated the agentId.");
      }
      
      if (!data?.signedUrl) {
        throw new Error("No signed URL returned from server");
      }

      console.log("Starting conversation with signed URL");
      await conversation.startSession({ 
        signedUrl: data.signedUrl 
      });
    } catch (error) {
      console.error("Failed to initialize voice coach:", error);
      toast({
        title: "Setup Required",
        description: error instanceof Error ? error.message : "Please create an ElevenLabs agent first. See ELEVENLABS_SETUP.md for instructions.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleToggleConversation = async () => {
    if (conversation.status === "connected") {
      await conversation.endSession();
    } else {
      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        await initializeVoiceCoach();
      } catch (error) {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use the voice coach.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="shadow-lg border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-600/10">
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          AI Voice Coach
        </CardTitle>
        <CardDescription>
          Talk to your AI coach about your performance analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          {conversation.status === "connected" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              {conversation.isSpeaking ? (
                <>
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span>Coach is speaking...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-green-600" />
                  <span>Listening...</span>
                </>
              )}
            </div>
          )}

          <Button
            onClick={handleToggleConversation}
            disabled={isInitializing}
            size="lg"
            variant={conversation.status === "connected" ? "destructive" : "default"}
            className="w-full max-w-xs"
          >
            {isInitializing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : conversation.status === "connected" ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                End Conversation
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Start Voice Coaching
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {conversation.status === "connected"
                ? "Speak naturally to discuss your routine with the AI coach"
                : "Click the button above to start a voice conversation"}
            </p>
            
            {conversation.status === "disconnected" && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mt-4">
                <p className="font-medium mb-1">💡 What you can ask:</p>
                <ul className="text-left space-y-1 ml-4">
                  <li>• "How can I improve my landing stability?"</li>
                  <li>• "What does my posture score mean?"</li>
                  <li>• "Give me tips for better form"</li>
                  <li>• "What should I focus on next?"</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
