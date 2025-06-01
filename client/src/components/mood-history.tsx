import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

interface MoodEntry {
  id: number;
  userId: number;
  mood: string;
  emoji: string;
  note?: string;
  timestamp: string;
}

export function MoodHistory() {
  // Load today's moods from database
  const { data: todaysMoods } = useQuery<MoodEntry[]>({
    queryKey: ["/api/moods"],
    queryFn: async () => {
      const response = await fetch("/api/moods?limit=50");
      return response.json();
    },
  });

  // Filter today's mood entries
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = todaysMoods?.filter(mood => 
    mood.timestamp.startsWith(today)
  ) || [];

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
    </Card>
  );
}