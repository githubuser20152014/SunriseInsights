import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

interface DailyMessage {
  text: string;
  author: string;
}

export function DailyMessage() {
  const { data: message, isLoading } = useQuery<DailyMessage>({
    queryKey: ["/api/daily-message"],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  if (isLoading) {
    return (
      <Card className="glass-card gradient-sunrise rounded-2xl p-6 text-white border-0 hover-lift">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1 animate-gentle-pulse">
            <i className="fas fa-quote-left text-lg"></i>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-medium mb-2">Today's Inspiration</h2>
            <div className="skeleton rounded">
              <div className="h-4 bg-white/20 rounded mb-2"></div>
              <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card gradient-sunrise rounded-2xl p-6 border-0 hover-lift animate-soft-glow">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1 animate-gentle-pulse">
          <i className="fas fa-quote-left text-lg text-white drop-shadow-sm"></i>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-medium mb-2 text-white drop-shadow-sm">Today's Inspiration</h2>
          <p className="text-white leading-relaxed font-medium drop-shadow-sm">
            {message?.text || "Loading your daily inspiration..."}
          </p>
          {message?.author && (
            <div className="text-xs text-white/90 mt-3 font-medium drop-shadow-sm">
              — {message.author}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
