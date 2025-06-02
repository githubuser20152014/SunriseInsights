import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceRecording } from "@/hooks/use-voice-recording";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyReflection {
  id: number;
  transcript: string;
  summary: string | null;
  recordedAt: string;
}

export function DailyReflection() {
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [typedReflection, setTypedReflection] = useState("");
  const [useTextInput, setUseTextInput] = useState(false);
  const [showPastReflections, setShowPastReflections] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load past reflections
  const { data: pastReflections } = useQuery<DailyReflection[]>({
    queryKey: ["/api/daily-reflections"],
    queryFn: async () => {
      const response = await fetch("/api/daily-reflections");
      return response.json();
    },
  });

  const createReflectionMutation = useMutation({
    mutationFn: async (transcript: string) => {
      const response = await apiRequest("POST", "/api/daily-reflections", { transcript });
      return response.json();
    },
    onSuccess: (data: DailyReflection) => {
      setLastSummary(data.summary);
      queryClient.invalidateQueries({ queryKey: ["/api/daily-reflections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      toast({
        title: "Reflection saved",
        description: "Your end-of-day thoughts have been recorded and summarized.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your reflection. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { isRecording, isSupported, transcript, interimTranscript, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: (transcript: string) => {
      createReflectionMutation.mutate(transcript);
    },
    onError: (error: string) => {
      toast({
        title: "Recording Error",
        description: error,
        variant: "destructive",
      });
      setUseTextInput(true);
    },
  });

  const handleSubmitTypedReflection = () => {
    if (typedReflection.trim()) {
      createReflectionMutation.mutate(typedReflection.trim());
      setTypedReflection("");
    }
  };

  const displayTranscript = transcript + interimTranscript;

  return (
    <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <i className="fas fa-moon text-indigo-600 text-sm"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-800">End of Day Reflection</h3>
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
                placeholder="How did your day go? What did you accomplish? What did you learn? Any thoughts about tomorrow?"
                value={typedReflection}
                onChange={(e) => setTypedReflection(e.target.value)}
                className="min-h-[140px] border-0 bg-white focus:ring-2 focus:ring-indigo-500 resize-none"
                disabled={createReflectionMutation.isPending}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  {!isSupported ? "Voice recording not available - using text input" : "Text input mode"}
                </p>
                <Button
                  onClick={handleSubmitTypedReflection}
                  disabled={!typedReflection.trim() || createReflectionMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                >
                  {createReflectionMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Save Reflection
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
                  <div className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: "20px" }}></div>
                  <div className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: "35px", animationDelay: "0.1s" }}></div>
                  <div className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: "15px", animationDelay: "0.2s" }}></div>
                  <div className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: "40px", animationDelay: "0.3s" }}></div>
                  <div className="w-1 bg-indigo-500 rounded-full animate-pulse" style={{ height: "25px", animationDelay: "0.4s" }}></div>
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
              disabled={createReflectionMutation.isPending}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 mx-auto ${
                isRecording 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
              }`}
            >
              <i className={`fas text-xl ${isRecording ? "fa-stop" : "fa-microphone"}`}></i>
            </Button>
            
            <p className="text-sm text-slate-600 mt-3">
              {isRecording 
                ? "Recording your reflection... Tap to stop" 
                : createReflectionMutation.isPending 
                  ? "Processing your reflection..."
                  : "Share how your day went"
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
        {(lastSummary || createReflectionMutation.isPending) && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-lightbulb text-indigo-600 text-sm"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-800 mb-2">Daily Insight</h4>
                {createReflectionMutation.isPending ? (
                  <div className="animate-pulse">
                    <div className="h-3 bg-indigo-200 rounded mb-2"></div>
                    <div className="h-3 bg-indigo-200 rounded w-3/4"></div>
                  </div>
                ) : lastSummary ? (
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {lastSummary}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Your reflection has been saved. AI summary temporarily unavailable.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Past Reflections Section */}
        {pastReflections && pastReflections.length > 0 && (
          <div className="mt-4">
            <Button
              onClick={() => setShowPastReflections(!showPastReflections)}
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-800 p-0"
            >
              <i className={`fas ${showPastReflections ? 'fa-chevron-down' : 'fa-chevron-right'} mr-2`}></i>
              View Past Reflections ({pastReflections.length})
            </Button>
            
            {showPastReflections && (
              <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
                {pastReflections.map((reflection) => (
                  <div key={reflection.id} className="bg-slate-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-slate-500">
                        {new Date(reflection.recordedAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZone: 'America/New_York'
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-slate-700 mb-1">Reflection:</h5>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {reflection.transcript}
                        </p>
                      </div>
                      
                      {reflection.summary && (
                        <div>
                          <h5 className="text-sm font-medium text-slate-700 mb-1">Daily Insight:</h5>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {reflection.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}