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
import { TimeTracker } from "@/components/time-tracker";
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

interface WeatherData {
  temperature: number;
  maxTemp: number;
  minTemp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export default function Home() {
  // Initialize daily reset functionality
  useDailyReset();

  const { data: sunData } = useQuery<SunData>({
    queryKey: ["/api/sunrise"],
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const { data: weatherData } = useQuery<WeatherData>({
    queryKey: ["/api/weather"],
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Elegant warm background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-40 h-40 gradient-warm rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-8 w-32 h-32 gradient-forest rounded-full blur-2xl animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 gradient-sunrise rounded-full blur-2xl animate-float" style={{ animationDelay: '6s' }}></div>
      </div>

      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-0 hover-lift animate-soft-glow">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-3 sm:py-4">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        {/* Header Section - Full Width */}
        <div className="mb-8 space-y-6">
          {/* Location Status */}
          <div className="glass-card rounded-3xl p-5 border-0 hover-lift animate-gentle-pulse">
            <div className="grid grid-cols-3 items-center text-sm">
              {/* Location */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 gradient-forest rounded-full flex items-center justify-center">
                  <i className="fas fa-map-marker-alt text-white text-xs"></i>
                </div>
                <span className="text-foreground font-medium">Alpharetta, GA</span>
              </div>
              
              {/* Weather Forecast */}
              <div className="flex items-center justify-center space-x-3">
                {weatherData ? (
                  <>
                    <div className="text-center">
                      <div className="text-foreground font-medium capitalize">
                        {weatherData.condition}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        High: {weatherData.maxTemp}° Low: {weatherData.minTemp}°
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gradient-sunrise">
                      {weatherData.temperature}°
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="text-muted-foreground text-xs">
                      Loading weather...
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sun Times */}
              <div className="text-muted-foreground text-xs text-right">
                <div className="flex justify-end space-x-4">
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-sun text-yellow-500 text-xs"></i>
                    <span>{sunData?.sunrise?.formatted || "Loading..."}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <i className="fas fa-moon text-blue-400 text-xs"></i>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <DailyTasks />
          <div className="space-y-4 sm:space-y-6">
            <DailyNotes />
            <DailyGratitude />
          </div>
        </div>

        {/* Time Tracker Row */}
        <div className="mb-6 sm:mb-8">
          <TimeTracker />
        </div>

        {/* Mood Tracking Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
