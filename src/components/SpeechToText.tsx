import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Trash2, Save } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SpeechToTextProps {
  onSaveNote?: (note: string) => void;
}

export const SpeechToText = ({ onSaveNote }: SpeechToTextProps) => {
  const { 
    isRecording, 
    transcript, 
    interimTranscript, 
    startRecording, 
    stopRecording,
    clearTranscript 
  } = useSpeechToText();
  
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSaveNote = async () => {
    if (!transcript.trim()) {
      toast({
        title: 'Nothing to save',
        description: 'Please record something first',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Save to database
      const { error } = await supabase
        .from('analysis_sessions')
        .insert({
          voice_notes: transcript,
        } as any);

      if (error) throw error;

      toast({
        title: 'Note Saved',
        description: 'Your voice note has been saved successfully',
      });

      if (onSaveNote) {
        onSaveNote(transcript);
      }

      clearTranscript();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save your note. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const displayText = transcript + (interimTranscript ? ' ' + interimTranscript : '');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Voice Notes</CardTitle>
        <CardDescription>
          Record voice notes about your routine, technique, or goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleToggleRecording}
            variant={isRecording ? 'destructive' : 'default'}
            className="flex-1"
            size="lg"
          >
            {isRecording ? (
              <>
                <MicOff className="mr-2 h-5 w-5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </>
            )}
          </Button>
          
          {transcript && !isRecording && (
            <>
              <Button
                onClick={clearTranscript}
                variant="outline"
                size="lg"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={isSaving}
                size="lg"
              >
                <Save className="mr-2 h-5 w-5" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 text-destructive animate-pulse">
            <div className="h-3 w-3 bg-destructive rounded-full" />
            <span className="text-sm font-medium">Listening...</span>
          </div>
        )}

        {/* Transcript Display */}
        <div className="min-h-[200px] p-4 rounded-lg bg-muted">
          {displayText ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              <span className="text-foreground">{transcript}</span>
              {interimTranscript && (
                <span className="text-muted-foreground italic">
                  {' '}{interimTranscript}
                </span>
              )}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">
              Click "Start Recording" to begin taking voice notes
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground">
          <p>💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Speak clearly and at a normal pace</li>
            <li>Notes are transcribed in real-time</li>
            <li>Click Save to store your notes in the session history</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
