import { useState, useCallback, useRef } from "react";

interface UseVoiceRecordingProps {
  onTranscriptionComplete: (transcript: string) => void;
  onError: (error: string) => void;
}

interface VoiceRecordingState {
  isRecording: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
}

export function useVoiceRecording({ onTranscriptionComplete, onError }: UseVoiceRecordingProps) {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    transcript: '',
    interimTranscript: '',
  });

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(() => {
    if (!state.isSupported) {
      onError("Speech recognition is not supported in this browser");
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setState(prev => ({ ...prev, isRecording: true, transcript: '', interimTranscript: '' }));
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setState(prev => ({
          ...prev,
          transcript: prev.transcript + finalTranscript,
          interimTranscript,
        }));

        // Reset the auto-stop timer
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Auto-stop after 3 seconds of silence
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
          }
        }, 3000);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        onError(`Speech recognition error: ${event.error}`);
        setState(prev => ({ ...prev, isRecording: false }));
      };

      recognition.onend = () => {
        setState(prev => {
          const fullTranscript = prev.transcript + prev.interimTranscript;
          if (fullTranscript.trim()) {
            onTranscriptionComplete(fullTranscript.trim());
          }
          return { ...prev, isRecording: false, interimTranscript: '' };
        });
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      onError("Failed to start voice recording");
    }
  }, [state.isSupported, onTranscriptionComplete, onError]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  return {
    ...state,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
