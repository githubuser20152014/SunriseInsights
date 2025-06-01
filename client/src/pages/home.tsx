import { useQuery } from "@tanstack/react-query";
import { DailyMessage } from "@/components/daily-message";
import { VoiceRecording } from "@/components/voice-recording";
import { DailyTasks } from "@/components/daily-tasks";
import { ProgressStats } from "@/components/progress-stats";

interface SunriseData {
  formatted: string;
}

export default function Home() {
  const { data: sunrise } = useQuery<SunriseData>({
    queryKey: ["/api/sunrise"],
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="bg-gradient-to-br from-orange-50 to-blue-50 min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                <i className="fas fa-sun text-white text-sm"></i>
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Morning Clarity</h1>
            </div>
            <div className="text-sm text-slate-600">
              {currentTime}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Location Status */}
        <div className="flex items-center justify-center space-x-2 text-sm text-slate-600">
          <i className="fas fa-map-marker-alt text-orange-500"></i>
          <span>Atlanta, GA</span>
          <span>•</span>
          <span>Sunrise {sunrise?.formatted || "Loading..."}</span>
        </div>

        {/* Daily Message */}
        <DailyMessage />

        {/* Voice Recording */}
        <VoiceRecording />

        {/* Daily Tasks */}
        <DailyTasks />

        {/* Progress Stats */}
        <ProgressStats />
      </main>
    </div>
  );
}
