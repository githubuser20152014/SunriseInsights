import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyGratitude {
  id?: number;
  content: string;
  date: string;
  updatedAt?: string;
}

export function DailyGratitude() {
  const [gratitude, setGratitude] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPastGratitude, setShowPastGratitude] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  // Load gratitude from database
  const { data: gratitudeData } = useQuery<DailyGratitude>({
    queryKey: ["/api/daily-gratitude", today],
    queryFn: async () => {
      const response = await fetch(`/api/daily-gratitude?date=${today}`);
      return response.json();
    },
  });

  // Load past gratitude entries
  const { data: pastGratitude } = useQuery<DailyGratitude[]>({
    queryKey: ["/api/past-gratitude"],
    queryFn: async () => {
      const response = await fetch("/api/search-gratitude?q=.");
      const results = await response.json();
      return results.filter((entry: DailyGratitude) => entry.content.trim());
    },
  });

  // Update local state when data loads
  useEffect(() => {
    if (gratitudeData?.content) {
      setGratitude(gratitudeData.content);
      if (gratitudeData.updatedAt) {
        setLastSaved(new Date(gratitudeData.updatedAt));
      }
    }
  }, [gratitudeData]);

  const saveGratitudeMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/daily-gratitude", {
        content,
        date: today,
      });
      return response.json();
    },
    onSuccess: (data: DailyGratitude) => {
      if (data.updatedAt) {
        setLastSaved(new Date(data.updatedAt));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/daily-gratitude", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/past-gratitude"] });
      
      toast({
        title: "Gratitude saved",
        description: "Your daily gratitude has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your gratitude. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveGratitude = () => {
    if (gratitude.trim()) {
      saveGratitudeMutation.mutate(gratitude.trim());
    }
  };

  const clearGratitude = () => {
    setGratitude("");
    setLastSaved(null);
    saveGratitudeMutation.mutate("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York'
    });
  };

  return (
    <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <i className="fas fa-heart text-amber-600 text-sm"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-800">Today I am grateful for...</h3>
          </div>
          <div className="flex items-center space-x-2">
            {pastGratitude && pastGratitude.length > 0 && (
              <Button
                onClick={() => setShowPastGratitude(!showPastGratitude)}
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-700"
              >
                <i className={`fas ${showPastGratitude ? 'fa-chevron-down' : 'fa-chevron-right'} mr-1`}></i>
                Past Entries
              </Button>
            )}
            {gratitude.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearGratitude}
                className="text-xs text-slate-500 hover:text-red-600"
              >
                <i className="fas fa-trash mr-1"></i>
                Clear
              </Button>
            )}
            <Button
              onClick={saveGratitude}
              disabled={saveGratitudeMutation.isPending || !gratitude.trim()}
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {saveGratitudeMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Past Gratitude Section */}
        {showPastGratitude && pastGratitude && pastGratitude.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Past Gratitude Entries</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {pastGratitude.slice().reverse().map((entry) => (
                <div key={entry.id} className="bg-white rounded p-3 border border-amber-200">
                  <div className="text-xs text-amber-600 mb-1">
                    {formatDate(entry.date)}
                  </div>
                  <div className="text-sm text-slate-700">
                    {entry.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <Textarea
          placeholder="Take a moment to reflect on what you're grateful for today - big or small moments, people, experiences, or simple joys..."
          value={gratitude}
          onChange={(e) => setGratitude(e.target.value)}
          className="min-h-[100px] border-0 bg-amber-50 focus:ring-2 focus:ring-amber-500 resize-none"
        />
        
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span>{gratitude.length} characters</span>
            {gratitude.trim() && (
              <span>{gratitude.trim().split(/\s+/).length} words</span>
            )}
          </div>
          {lastSaved && (
            <div className="flex items-center space-x-1">
              <i className="fas fa-check-circle text-green-500"></i>
              <span>
                Last saved {lastSaved.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-amber-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <i className="fas fa-lightbulb text-amber-600 text-sm mt-0.5"></i>
          <div className="text-xs text-amber-700">
            <strong>Gratitude practice:</strong> Regular gratitude journaling has been shown to improve mood, reduce stress, and increase overall life satisfaction. Even small acknowledgments can make a big difference.
          </div>
        </div>
      </div>
    </Card>
  );
}