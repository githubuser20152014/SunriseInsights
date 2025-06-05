import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MoodEntry {
  id: number;
  userId: number;
  mood: string;
  emoji: string;
  note?: string;
  timestamp: string;
}

const moods = [
  { mood: "grateful", emoji: "🙏", label: "Grateful" },
  { mood: "energized", emoji: "⚡", label: "Energized" },
  { mood: "calm", emoji: "😌", label: "Calm" },
  { mood: "motivated", emoji: "🔥", label: "Motivated" },
  { mood: "reflective", emoji: "🤔", label: "Reflective" },
  { mood: "excited", emoji: "🎉", label: "Excited" },
];

export function MoodSelector() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: todaysMoods = [] } = useQuery<MoodEntry[]>({
    queryKey: ["/api/moods"],
  });

  const createMoodMutation = useMutation({
    mutationFn: async (moodData: { mood: string; emoji: string; note?: string }) => {
      const response = await apiRequest("POST", "/api/moods", moodData);
      return response.json();
    },
    onSuccess: (data: MoodEntry) => {
      queryClient.invalidateQueries({ queryKey: ["/api/moods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood-analysis"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood-analysis-history"] });
      setSelectedMood(null);
      setNote("");
      toast({
        title: "Mood recorded",
        description: `Your ${data.mood} mood has been saved.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error recording mood",
        description: error?.message || "Failed to record mood. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMoodSelect = (mood: string, emoji: string) => {
    setSelectedMood(mood);
    // Auto-submit the mood without requiring a note
    createMoodMutation.mutate({ mood, emoji, note: note || undefined });
  };

  // Get the last recorded mood for today to show as selected
  const lastMood = todaysMoods[0];

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        marginBottom: '20px'
      }}>
        {moods.map(({ mood, emoji, label }) => (
          <div
            key={mood}
            onClick={() => handleMoodSelect(mood, emoji)}
            style={{
              textAlign: 'center',
              padding: '15px 10px',
              border: '2px solid #f0f0f0',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderColor: lastMood?.mood === mood ? '#667eea' : '#f0f0f0',
              background: lastMood?.mood === mood ? '#667eea' : 'transparent',
              color: lastMood?.mood === mood ? 'white' : '#333'
            }}
            onMouseEnter={(e) => {
              if (lastMood?.mood !== mood) {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.background = '#f8f9ff';
              }
            }}
            onMouseLeave={(e) => {
              if (lastMood?.mood !== mood) {
                e.currentTarget.style.borderColor = '#f0f0f0';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <div style={{
              fontSize: '24px',
              marginBottom: '5px'
            }}>
              {emoji}
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: 500
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Optional note input */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note about your mood (optional)..."
        style={{
          width: '100%',
          minHeight: '60px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none'
        }}
        maxLength={200}
      />

      {lastMood && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666'
        }}>
          <strong>Current mood:</strong> {lastMood.emoji} {lastMood.mood}
          {lastMood.note && (
            <div style={{ marginTop: '5px', fontStyle: 'italic' }}>
              "{lastMood.note}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}