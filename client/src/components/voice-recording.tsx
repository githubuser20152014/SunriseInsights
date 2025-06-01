import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecording {
  id: number;
  transcript: string;
  summary: string | null;
  recordedAt: string;
}

export function VoiceRecording() {
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [typedThoughts, setTypedThoughts] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createRecordingMutation = useMutation({
    mutationFn: async (transcript: string) => {
      const response = await apiRequest("POST", "/api/voice-recordings", { transcript });
      return response.json();
    },
    onSuccess: (data: VoiceRecording) => {
      setLastSummary(data.summary);
      queryClient.invalidateQueries({ queryKey: ["/api/voice-recordings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      toast({
        title: "Recording processed",
        description: "Your thoughts have been analyzed and summarized.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process your recording. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { isRecording, isSupported, transcript, interimTranscript, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: (transcript: string) => {
      createRecordingMutation.mutate(transcript);
    },
    onError: (error: string) => {
      toast({
        title: "Recording Error",
        description: error,
        variant: "destructive",
      });
      // Switch to text input if voice recording fails
      setUseTextInput(true);
    },
  });

  const handleSubmitTypedThoughts = () => {
    if (typedThoughts.trim()) {
      createRecordingMutation.mutate(typedThoughts.trim());
      setTypedThoughts("");
    }
  };

  const displayTranscript = transcript + interimTranscript;

  return (
    <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <i className="fas fa-microphone text-blue-600 text-sm"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-800">Brain Dump</h3>
        </div>
        {isSupported && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUseTextInput(!useTextInput)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            <i className={`fas ${useTextInput ? "fa-microphone" : "fa-keyboard"} mr-1`}></i>
            {useTextInput ? "Voice" : "Type"}
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        {!isSupported || useTextInput ? (
          // Text Input Mode
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Type your thoughts here..."
                value={typedThoughts}
                onChange={(e) => setTypedThoughts(e.target.value)}
                className="min-h-[120px] border-0 bg-white focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={createRecordingMutation.isPending}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  {!isSupported ? "Voice recording not available - using text input" : "Text input mode"}
                </p>
                <Button
                  onClick={handleSubmitTypedThoughts}
                  disabled={!typedThoughts.trim() || createRecordingMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {createRecordingMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Voice Recording Mode
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            {/* Recording Visualizer */}
            <div className="flex items-center justify-center space-x-1 h-12 mb-4">
              {isRecording ? (
                <>
                  <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: "20px" }}></div>
                  <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: "35px", animationDelay: "0.1s" }}></div>
                  <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: "15px", animationDelay: "0.2s" }}></div>
                  <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: "40px", animationDelay: "0.3s" }}></div>
                  <div className="w-1 bg-blue-500 rounded-full animate-pulse" style={{ height: "25px", animationDelay: "0.4s" }}></div>
                </>
              ) : (
                <>
                  <div className="w-1 bg-slate-300 rounded-full" style={{ height: "20px" }}></div>
                  <div className="w-1 bg-slate-300 rounded-full" style={{ height: "35px" }}></div>
                  <div className="w-1 bg-slate-300 rounded-full" style={{ height: "15px" }}></div>
                  <div className="w-1 bg-slate-300 rounded-full" style={{ height: "40px" }}></div>
                  <div className="w-1 bg-slate-300 rounded-full" style={{ height: "25px" }}></div>
                </>
              )}
            </div>
            
            <Button
              onClick={toggleRecording}
              disabled={createRecordingMutation.isPending}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 mx-auto ${
                isRecording 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              }`}
            >
              <i className={`fas text-xl ${isRecording ? "fa-stop" : "fa-microphone"}`}></i>
            </Button>
            
            <p className="text-sm text-slate-600 mt-3">
              {isRecording 
                ? "Recording... Tap to stop" 
                : createRecordingMutation.isPending 
                  ? "Processing your thoughts..."
                  : "Tap to start recording your thoughts"
              }
            </p>

            {/* Live Transcript */}
            {displayTranscript && (
              <div className="mt-4 p-3 bg-white rounded-lg border text-left">
                <p className="text-sm text-slate-700">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-slate-400 italic">{interimTranscript}</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* AI Summary Display */}
        {(lastSummary || createRecordingMutation.isPending) && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-brain text-emerald-600 text-sm"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-800 mb-2">AI Summary</h4>
                {createRecordingMutation.isPending ? (
                  <div className="animate-pulse">
                    <div className="h-3 bg-emerald-200 rounded mb-2"></div>
                    <div className="h-3 bg-emerald-200 rounded w-3/4"></div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {lastSummary}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
