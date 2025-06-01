import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

interface UserStats {
  dayStreak: number;
  totalRecordings: number;
  totalCompletedTasks: number;
}

export function ProgressStats() {
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ["/api/user-stats"],
  });

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Your Progress</h3>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-2"></div>
              <div className="h-6 bg-slate-200 rounded mb-1"></div>
              <div className="h-3 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="text-lg font-medium text-slate-800 mb-4">Your Progress</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <i className="fas fa-calendar-day text-white"></i>
          </div>
          <div className="text-2xl font-semibold text-slate-800">
            {stats?.dayStreak || 1}
          </div>
          <div className="text-xs text-slate-600">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <i className="fas fa-microphone text-white"></i>
          </div>
          <div className="text-2xl font-semibold text-slate-800">
            {stats?.totalRecordings || 0}
          </div>
          <div className="text-xs text-slate-600">Recordings</div>
        </div>
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <i className="fas fa-check-circle text-white"></i>
          </div>
          <div className="text-2xl font-semibold text-slate-800">
            {stats?.totalCompletedTasks || 0}
          </div>
          <div className="text-xs text-slate-600">Tasks Done</div>
        </div>
      </div>
    </Card>
  );
}
