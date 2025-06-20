import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  { emoji: "😊", mood: "happy", color: "from-yellow-400 to-orange-400", description: "Cheerful and content" },
  { emoji: "😌", mood: "calm", color: "from-green-400 to-teal-400", description: "Relaxed and centered" },
  { emoji: "🤔", mood: "reflective", color: "from-purple-400 to-indigo-400", description: "Thoughtful and contemplative" },
  { emoji: "😴", mood: "sleepy", color: "from-blue-400 to-purple-400", description: "Tired but content" },
  { emoji: "🌟", mood: "motivated", color: "from-pink-400 to-rose-400", description: "Ready to conquer the day" },
  { emoji: "🙏", mood: "grateful", color: "from-amber-400 to-yellow-400", description: "Thankful and appreciative" },
  { emoji: "🥺", mood: "vulnerable", color: "from-rose-400 to-pink-400", description: "Sensitive and open" },
  { emoji: "🔥", mood: "energized", color: "from-red-400 to-orange-400", description: "Full of energy and passion" },
  { emoji: "🤩", mood: "excited", color: "from-cyan-400 to-blue-400", description: "Thrilled and enthusiastic" },
  { emoji: "😢", mood: "upset", color: "from-indigo-400 to-purple-400", description: "Feeling down or distressed" },
  { emoji: "🌈", mood: "hopeful", color: "from-emerald-400 to-green-400", description: "Optimistic about the future" },
  { emoji: "😰", mood: "afraid", color: "from-slate-400 to-gray-400", description: "Anxious or worried" }
];

export function MoodSelector() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMoodMutation = useMutation({
    mutationFn: async (moodData: { mood: string; emoji: string; note?: string }) => {
      const response = await apiRequest("POST", "/api/moods", moodData);
      return response.json();
    },
    onSuccess: (data: MoodEntry) => {
      setSelectedMood(null);
      setNote("");
      setShowNoteInput(false);
      
      queryClient.invalidateQueries({ queryKey: ["/api/moods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
      
      toast({
        title: "Mood captured",
        description: `Your ${data.mood} mood has been recorded. ${data.note ? "Your note was saved too." : ""}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your mood. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMoodSelect = (mood: typeof moods[0]) => {
    setSelectedMood(mood.mood);
    setShowNoteInput(true);
  };

  const saveMood = () => {
    if (!selectedMood) return;
    
    const selectedMoodData = moods.find(m => m.mood === selectedMood);
    if (!selectedMoodData) return;

    createMoodMutation.mutate({
      mood: selectedMoodData.mood,
      emoji: selectedMoodData.emoji,
      note: note.trim() || undefined,
    });
  };

  const cancelMood = () => {
    setSelectedMood(null);
    setNote("");
    setShowNoteInput(false);
  };

  return (
    <Card className="glass-card rounded-2xl p-6 border-0 hover-lift transition-all-smooth">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gradient-warm">How are you feeling?</h3>
        <span className="text-sm text-muted-foreground">Track your mood</span>
      </div>
      
      {!showNoteInput ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {moods.map((mood) => (
            <button
              key={mood.mood}
              onClick={() => handleMoodSelect(mood)}
              className={`group relative p-3 sm:p-4 rounded-xl btn-glass hover-lift transition-all-smooth border border-white/20 min-h-[4rem] sm:min-h-[5rem] mood-${mood.mood}`}
            >
              <div className="text-center space-y-2">
                <div className="text-2xl transform group-hover:scale-110 transition-transform duration-300 animate-gentle-pulse">
                  {mood.emoji}
                </div>
                <div className="text-xs sm:text-sm font-medium text-foreground capitalize">
                  {mood.mood}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
            <div className="text-2xl">
              {moods.find(m => m.mood === selectedMood)?.emoji}
            </div>
            <div>
              <div className="font-medium text-slate-800 capitalize">
                {selectedMood}
              </div>
              <div className="text-sm text-slate-500">
                {moods.find(m => m.mood === selectedMood)?.description}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Why are you feeling this way? (optional)
            </label>
            <Textarea
              placeholder="A quick note about what's influencing your mood..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[80px] border-0 bg-slate-50 focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={200}
            />
            <div className="text-xs text-slate-400 text-right">
              {note.length}/200
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={saveMood}
              disabled={createMoodMutation.isPending}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {createMoodMutation.isPending ? "Saving..." : "Save Mood"}
            </Button>
            <Button
              onClick={cancelMood}
              variant="outline"
              disabled={createMoodMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}