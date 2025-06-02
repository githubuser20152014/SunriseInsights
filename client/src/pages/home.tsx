import { useQuery } from "@tanstack/react-query";
import { DailyMessage } from "@/components/daily-message";
import { VoiceRecording } from "@/components/voice-recording";
import { DailyTasks } from "@/components/daily-tasks";
import { MoodSelector } from "@/components/mood-selector";
import { MoodHistory } from "@/components/mood-history";
import { DailyNotes } from "@/components/daily-notes";
import { DailyGratitude } from "@/components/daily-gratitude";
import { DailyReflection } from "@/components/daily-reflection";
import { ProgressStats } from "@/components/progress-stats";
import { useDailyReset } from "@/hooks/use-daily-reset";

interface SunData {
  sunrise: {
    time: string;
    formatted: string;
  };
  sunset: {
    time: string;
    formatted: string;
  };
}

export default function Home() {
  // Initialize daily reset functionality
  useDailyReset();

  const { data: sunData } = useQuery<SunData>({
    queryKey: ["/api/sunrise"],
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="gradient-dawn min-h-screen relative overflow-hidden">
      {/* Elegant background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-3xl float-animation"></div>
        <div className="absolute top-40 right-8 w-24 h-24 bg-gradient-to-br from-rose-200/40 to-pink-200/40 rounded-full blur-2xl float-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-full blur-2xl float-animation" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-0 shadow-lg">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 gradient-sunset rounded-2xl flex items-center justify-center soft-glow">
                <i className="fas fa-sun text-white text-lg"></i>
              </div>
              <h1 className="text-2xl font-light text-gradient-warm tracking-wide">Morning Clarity</h1>
            </div>
            <div className="text-sm text-stone-600 font-medium">
              {currentTime}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header Section - Full Width */}
        <div className="mb-8 space-y-6">
          {/* Location Status */}
          <div className="glass-card rounded-3xl p-5 border-0 shadow-xl gentle-pulse">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-map-marker-alt text-white text-xs"></i>
                </div>
                <span className="text-stone-700 font-medium">Alpharetta, GA</span>
              </div>
              <div className="text-stone-600 text-xs">
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-sun text-amber-500 text-xs"></i>
                    <span>{sunData?.sunrise?.formatted || "Loading..."}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-moon text-indigo-500 text-xs"></i>
                    <span>{sunData?.sunset?.formatted || "Loading..."}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Message */}
          <DailyMessage />
        </div>

        {/* Brain Dump Section */}
        <div className="mb-8">
          <VoiceRecording />
        </div>

        {/* Tasks and Notes Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <DailyTasks />
          <DailyNotes />
        </div>

        {/* Gratitude Section */}
        <div className="mb-8">
          <DailyGratitude />
        </div>

        {/* Mood Tracking Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MoodSelector />
          <MoodHistory />
        </div>

        {/* End of Day Reflection */}
        <div className="mb-8">
          <DailyReflection />
        </div>

        {/* Progress Stats */}
        <div className="mb-8">
          <ProgressStats />
        </div>

        {/* Bottom padding for elegant spacing */}
        <div className="h-8"></div>
      </main>
    </div>
  );
}
