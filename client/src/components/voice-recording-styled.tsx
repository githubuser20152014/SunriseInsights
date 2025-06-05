import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecording {
  id: number;
  transcript: string;
  summary: string | null;
  recordedAt: string;
}

export function VoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showPastRecordings, setShowPastRecordings] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recordings = [] } = useQuery<VoiceRecording[]>({
    queryKey: ["/api/voice-recordings"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      const response = await apiRequest("POST", "/api/voice-recordings", formData);
      return response.json();
    },
    onSuccess: (data: VoiceRecording) => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-recordings"] });
      setAudioBlob(null);
      toast({
        title: "Recording processed",
        description: data.summary ? "Your thoughts have been transcribed and summarized." : "Your recording has been transcribed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error processing recording",
        description: error?.message || "Failed to process recording. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record your thoughts.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadRecording = () => {
    if (audioBlob) {
      uploadMutation.mutate(audioBlob);
    }
  };

  const todaysRecordings = recordings.filter(recording => {
    const recordingDate = new Date(recording.recordedAt).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return recordingDate === today;
  });

  return (
    <div>
      {!isRecording && !audioBlob && (
        <button
          onClick={startRecording}
          style={{
            width: '100%',
            padding: '15px',
            border: 'none',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🎤 Start Recording
        </button>
      )}

      {isRecording && (
        <button
          onClick={stopRecording}
          style={{
            width: '100%',
            padding: '15px',
            border: 'none',
            borderRadius: '12px',
            background: '#dc3545',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          ⏹️ Stop Recording
        </button>
      )}

      {audioBlob && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={uploadRecording}
            disabled={uploadMutation.isPending}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              background: '#28a745',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            {uploadMutation.isPending ? "Processing..." : "Upload & Transcribe"}
          </button>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Recording ready to upload
          </div>
        </div>
      )}

      {todaysRecordings.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          {todaysRecordings.map((recording) => (
            <div key={recording.id} style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '10px'
            }}>
              <div style={{
                fontSize: '14px',
                lineHeight: 1.5,
                marginBottom: recording.summary ? '10px' : 0
              }}>
                {recording.transcript}
              </div>
              {recording.summary && (
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  lineHeight: 1.4
                }}>
                  <strong>✨ AI Summary:</strong> {recording.summary}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}