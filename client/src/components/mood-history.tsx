import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface MoodEntry {
  id: number;
  userId: number;
  mood: string;
  emoji: string;
  note?: string;
  timestamp: string;
}

export function MoodHistory() {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");

  // Get today's date in Eastern Time
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

  // Load today's moods from database
  const { data: todaysMoods } = useQuery<MoodEntry[]>({
    queryKey: ["/api/moods", today],
    queryFn: async () => {
      const response = await fetch("/api/moods?limit=50");
      return response.json();
    },
  });

  // Filter today's mood entries using Eastern Time
  const todayEntries = todaysMoods?.filter(mood => {
    const moodDate = new Date(mood.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    return moodDate === today;
  }) || [];

  // AI mood analysis mutation
  const analyzeMoodMutation = useMutation({
    mutationFn: async (moodEntries: MoodEntry[]) => {
      const response = await apiRequest("POST", "/api/analyze-mood-journey", {
        moodEntries
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setShowAnalysis(true);
    },
    onError: () => {
      setAnalysis("Unable to analyze mood journey at this time. Please try again later.");
      setShowAnalysis(true);
    },
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (todayEntries.length === 0) {
    return (
      <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h4 className="text-lg font-semibold text-slate-800 mb-4">Today's Mood Journey</h4>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-slate-500 text-sm">
            No mood entries yet today.<br />
            Start tracking to see your journey!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h4 className="text-lg font-semibold text-slate-800 mb-4">Today's Mood Journey</h4>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {todayEntries.map((entry) => (
          <div key={entry.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
            <div className="text-xl">{entry.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 capitalize">
                  {entry.mood}
                </span>
                <span className="text-sm text-slate-500">
                  {formatTime(entry.timestamp)}
                </span>
              </div>
              {entry.note && (
                <p className="text-sm text-slate-600 mt-1 break-words">
                  {entry.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* AI Mood Analysis Section */}
      {todayEntries.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-slate-700">AI Mood Insights</h5>
            <Button
              onClick={() => analyzeMoodMutation.mutate(todayEntries)}
              disabled={analyzeMoodMutation.isPending}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-xs"
            >
              {analyzeMoodMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-1"></i>
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="fas fa-brain mr-1"></i>
                  Analyze Journey
                </>
              )}
            </Button>
          </div>
          
          {showAnalysis && analysis && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-start space-x-2">
                <i className="fas fa-lightbulb text-purple-600 text-sm mt-0.5"></i>
                <div className="text-sm text-slate-700 leading-relaxed">
                  {analysis}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {todayEntries.length === 1 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-center py-3">
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-xs text-slate-500">
              Add another mood entry to get AI insights about your emotional journey today
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}