import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  { emoji: "😊", mood: "joyful", color: "from-yellow-400 to-orange-400", description: "Energetic and happy" },
  { emoji: "😌", mood: "peaceful", color: "from-green-400 to-teal-400", description: "Calm and centered" },
  { emoji: "🤔", mood: "reflective", color: "from-purple-400 to-indigo-400", description: "Thoughtful and contemplative" },
  { emoji: "😴", mood: "sleepy", color: "from-blue-400 to-purple-400", description: "Tired but content" },
  { emoji: "🌟", mood: "motivated", color: "from-pink-400 to-rose-400", description: "Ready to conquer the day" },
  { emoji: "😐", mood: "neutral", color: "from-gray-400 to-slate-400", description: "Balanced and steady" },
  { emoji: "🥺", mood: "vulnerable", color: "from-amber-400 to-yellow-400", description: "Sensitive and open" },
  { emoji: "🔥", mood: "energized", color: "from-red-400 to-orange-400", description: "Full of energy and passion" }
];

export function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentMoodEntry, setCurrentMoodEntry] = useState<MoodEntry | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load today's mood from localStorage
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedMood = localStorage.getItem(`daily-mood-${today}`);
    if (savedMood) {
      const moodData = JSON.parse(savedMood);
      setCurrentMoodEntry(moodData);
      setSelectedMood(moodData.mood);
    }
  }, []);

  const createMoodMutation = useMutation({
    mutationFn: async (moodData: { mood: string; emoji: string }) => {
      const response = await apiRequest("POST", "/api/moods", moodData);
      return response.json();
    },
    onSuccess: (data: MoodEntry) => {
      setCurrentMoodEntry(data);
      
      // Save to localStorage for quick access
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`daily-mood-${today}`, JSON.stringify(data));
      
      queryClient.invalidateQueries({ queryKey: ["/api/moods"] });
      
      toast({
        title: "Mood captured",
        description: `Your ${data.mood} mood has been recorded for today.`,
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
    setIsTransitioning(true);
    setSelectedMood(mood.mood);
    
    // Create mood transition effect
    setTimeout(() => {
      createMoodMutation.mutate({
        mood: mood.mood,
        emoji: mood.emoji,
      });
      setIsTransitioning(false);
    }, 600);
  };

  const getCurrentMoodData = () => {
    if (!selectedMood) return null;
    return moods.find(m => m.mood === selectedMood);
  };

  const currentMood = getCurrentMoodData();

  return (
    <Card className="glass-card rounded-3xl p-6 border-0 shadow-xl overflow-hidden relative">
      {/* Background mood gradient */}
      {currentMood && (
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${currentMood.color} opacity-10 transition-all duration-1000 ${isTransitioning ? 'scale-110' : 'scale-100'}`}
        />
      )}
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center">
              <i className="fas fa-heart text-white text-sm"></i>
            </div>
            <h3 className="text-lg font-medium text-stone-800">How are you feeling?</h3>
          </div>
          
          {currentMood && (
            <div className={`text-3xl ${isTransitioning ? 'animate-bounce scale-125' : ''} transition-all duration-500`}>
              {currentMood.emoji}
            </div>
          )}
        </div>

        {currentMoodEntry ? (
          // Show current mood
          <div className="space-y-4">
            <div className="text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm">
              <div className={`text-6xl mb-3 ${isTransitioning ? 'animate-pulse' : 'gentle-pulse'}`}>
                {currentMood?.emoji}
              </div>
              <h4 className="text-xl font-medium text-stone-800 capitalize mb-2">
                {currentMood?.mood}
              </h4>
              <p className="text-sm text-stone-600">
                {currentMood?.description}
              </p>
              <div className="mt-4 text-xs text-stone-500">
                Recorded at {new Date(currentMoodEntry.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentMoodEntry(null);
                setSelectedMood(null);
                const today = new Date().toISOString().split('T')[0];
                localStorage.removeItem(`daily-mood-${today}`);
              }}
              className="w-full text-stone-600 hover:text-stone-800"
            >
              <i className="fas fa-edit mr-2"></i>
              Change mood
            </Button>
          </div>
        ) : (
          // Show mood selection
          <div className="space-y-4">
            <p className="text-sm text-stone-600 text-center mb-4">
              Select an emoji that represents your current mood
            </p>
            
            <div className="grid grid-cols-4 gap-3">
              {moods.map((mood) => (
                <Button
                  key={mood.mood}
                  onClick={() => handleMoodSelect(mood)}
                  disabled={createMoodMutation.isPending}
                  className={`
                    h-16 w-full bg-white/80 hover:bg-white/90 border-0 shadow-sm
                    transition-all duration-300 hover:scale-105 hover:shadow-lg
                    ${selectedMood === mood.mood ? 'ring-2 ring-violet-400 scale-105' : ''}
                  `}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs text-stone-600 capitalize">{mood.mood}</span>
                  </div>
                </Button>
              ))}
            </div>
            
            {createMoodMutation.isPending && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2 text-stone-600">
                  <i className="fas fa-sparkles animate-spin"></i>
                  <span className="text-sm">Capturing your mood...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Floating mood particles */}
      {currentMood && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className={`absolute top-4 right-4 text-lg opacity-20 float-animation`}>
            {currentMood.emoji}
          </div>
          <div className={`absolute bottom-6 left-6 text-sm opacity-15 float-animation`} style={{ animationDelay: '1s' }}>
            {currentMood.emoji}
          </div>
          <div className={`absolute top-1/2 left-4 text-xs opacity-10 float-animation`} style={{ animationDelay: '2s' }}>
            {currentMood.emoji}
          </div>
        </div>
      )}
    </Card>
  );
}