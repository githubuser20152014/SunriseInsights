import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MoodEntry {
  id: number;
  userId: number;
  mood: string;
  emoji: string;
  note?: string;
  timestamp: string;
}

interface MoodAnalysis {
  id: number;
  userId: number;
  analysis: string;
  date: string;
  moodCount: number;
  createdAt: string;
}

export function MoodHistory() {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [showPastAnalyses, setShowPastAnalyses] = useState(false);
  const [showMoodInsights, setShowMoodInsights] = useState(true);
  const [showPastMoods, setShowPastMoods] = useState(false);

  // Get today's date in Eastern Time
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

  // Load all moods from database
  const { data: allMoods } = useQuery<MoodEntry[]>({
    queryKey: ["/api/moods"],
    queryFn: async () => {
      const response = await fetch("/api/moods?limit=50");
      return response.json();
    },
  });

  // Load today's mood analysis if it exists
  const { data: todaysAnalysis } = useQuery<MoodAnalysis>({
    queryKey: ["/api/mood-analysis", today],
    queryFn: async () => {
      const response = await fetch(`/api/mood-analysis?date=${today}`);
      return response.json();
    },
  });

  // Load past mood analyses
  const { data: pastAnalyses } = useQuery<MoodAnalysis[]>({
    queryKey: ["/api/mood-analysis-history"],
    queryFn: async () => {
      const response = await fetch("/api/mood-analysis-history?limit=10");
      return response.json();
    },
  });

  // Filter today's mood entries using Eastern Time
  const todayEntries = allMoods?.filter(mood => {
    const moodDate = new Date(mood.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    return moodDate === today;
  }) || [];

  // Filter past mood entries (not today)
  const pastMoods = allMoods?.filter(mood => {
    const moodDate = new Date(mood.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    return moodDate !== today;
  }) || [];

  // Group past moods by date
  const groupedPastMoods = pastMoods.reduce((acc, mood) => {
    const moodDate = new Date(mood.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    if (!acc[moodDate]) {
      acc[moodDate] = [];
    }
    acc[moodDate].push(mood);
    return acc;
  }, {} as Record<string, MoodEntry[]>);

  // Sort dates in descending order (newest first)
  const sortedPastDates = Object.keys(groupedPastMoods).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // AI mood analysis mutation
  const analyzeMoodMutation = useMutation({
    mutationFn: async (moodEntries: MoodEntry[]) => {
      const response = await apiRequest("POST", "/api/analyze-mood-journey", {
        moodEntries,
        date: today
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setShowAnalysis(true);
      // Invalidate queries to refresh the saved analysis
      queryClient.invalidateQueries({ queryKey: ["/api/mood-analysis", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/mood-analysis-history"] });
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

  const formatAnalysisDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    });
  };

  if (todayEntries.length === 0) {
    return (
      <Card className="glass-card rounded-2xl p-6 border-0 hover-lift transition-all-smooth">
        <h4 className="text-lg font-semibold text-gradient-warm mb-4">Today's Mood Journey</h4>
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
    <Card className="glass-card rounded-2xl p-6 border-0 hover-lift transition-all-smooth">
      <h4 className="text-lg font-semibold text-gradient-warm mb-4">Today's Mood Journey</h4>
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
            <div className="flex items-center space-x-2">
              <h5 className="text-sm font-medium text-slate-700">AI Mood Insights</h5>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMoodInsights(!showMoodInsights)}
                className="h-auto p-1 text-slate-600 hover:text-slate-800"
              >
                {showMoodInsights ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              {(pastAnalyses && pastAnalyses.length > 0) && (
                <Button
                  onClick={() => setShowPastAnalyses(!showPastAnalyses)}
                  variant="outline"
                  size="sm"
                  className="text-xs border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <i className="fas fa-history mr-1"></i>
                  Past Insights
                </Button>
              )}
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
                    {todaysAnalysis ? 'Refresh Analysis' : 'Analyze Journey'}
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {showMoodInsights && (
            <>
              {/* Show today's analysis if it exists */}
              {todaysAnalysis && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200 mb-4">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-lightbulb text-purple-600 text-sm mt-0.5"></i>
                    <div className="text-sm text-slate-700 leading-relaxed">
                      {todaysAnalysis.analysis}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show newly generated analysis */}
              {showAnalysis && analysis && !todaysAnalysis && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200 mb-4">
                  <div className="flex items-start space-x-2">
                    <i className="fas fa-lightbulb text-purple-600 text-sm mt-0.5"></i>
                    <div className="text-sm text-slate-700 leading-relaxed">
                      {analysis}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Past analyses dropdown */}
          {showPastAnalyses && pastAnalyses && pastAnalyses.length > 0 && (
            <div className="mt-4 space-y-3">
              <h6 className="text-xs font-medium text-slate-600 flex items-center">
                <i className="fas fa-history mr-2"></i>
                Previous AI Insights
              </h6>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {pastAnalyses.slice(0, 5).map((pastAnalysis) => (
                  <div key={pastAnalysis.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600">
                        {formatAnalysisDate(pastAnalysis.date)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {pastAnalysis.moodCount} mood{pastAnalysis.moodCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed">
                      {pastAnalysis.analysis}
                    </div>
                  </div>
                ))}
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

      {/* Past Moods Section */}
      {pastMoods.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-slate-700">Past Moods</h5>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPastMoods(!showPastMoods)}
              className="text-xs text-slate-600 hover:text-slate-800"
            >
              {showPastMoods ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Hide Past Moods
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  View Past Moods ({pastMoods.length})
                </>
              )}
            </Button>
          </div>
          
          {showPastMoods && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sortedPastDates.slice(0, 10).map((date) => (
                <div key={date} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">
                      {formatAnalysisDate(date)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {groupedPastMoods[date].length} mood{groupedPastMoods[date].length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {groupedPastMoods[date].map((mood) => (
                      <div key={mood.id} className="flex items-center justify-between bg-white rounded px-3 py-2 text-xs border border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span>{mood.emoji}</span>
                          <span className="text-slate-600 font-medium">{mood.mood}</span>
                          {mood.note && (
                            <span className="text-slate-400">• {mood.note.slice(0, 30)}{mood.note.length > 30 ? '...' : ''}</span>
                          )}
                        </div>
                        <span className="text-slate-400 text-xs">
                          {formatTimestamp(mood.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}