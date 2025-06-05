import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, Edit2, Trash2, Save, X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useDailyReset } from "@/hooks/use-daily-reset";

interface TimeLogEntry {
  id: number;
  userId: number;
  date: string;
  timeSlot: string;
  activity: string;
  createdAt: string;
  updatedAt: string;
}

interface TimeLogSummary {
  id: number;
  userId: number;
  date: string;
  summary: string;
  totalEntries: number;
  createdAt: string;
}

export function TimeTracker() {
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState("");
  const [showPastSummaries, setShowPastSummaries] = useState(false);
  const [showTodaySummary, setShowTodaySummary] = useState(true);
  const [isGeneratingAISummary, setIsGeneratingAISummary] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useDailyReset();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD in EST

  // Generate time slots from 5:00 AM to 10:00 PM EST in 30-minute increments
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 5; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) { // Don't add 10:30 PM slot
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, []);

  const { data: timeEntries = [], isLoading } = useQuery<TimeLogEntry[]>({
    queryKey: ["/api/time-log", { date: today }],
    queryFn: () => apiRequest("GET", `/api/time-log?date=${today}`).then(res => res.json()),
  });

  const { data: summary } = useQuery<TimeLogSummary>({
    queryKey: ["/api/time-log-summary", { date: today }],
    queryFn: () => apiRequest("GET", `/api/time-log-summary?date=${today}`).then(res => res.json()),
  });

  const { data: pastSummaries = [] } = useQuery<TimeLogSummary[]>({
    queryKey: ["/api/time-log-summary-history"],
    queryFn: () => apiRequest("GET", "/api/time-log-summary-history").then(res => res.json()),
    enabled: showPastSummaries,
  });

  const saveEntryMutation = useMutation({
    mutationFn: async ({ timeSlot, activity }: { timeSlot: string; activity: string }) => {
      const response = await apiRequest("POST", "/api/time-log", {
        date: today,
        timeSlot,
        activity: activity.trim()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-log"] });
      setEditingSlot(null);
      setEditingActivity("");
      toast({
        title: "Time entry saved",
        description: "Your activity has been logged successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save time entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/time-log/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-log"] });
      toast({
        title: "Entry deleted",
        description: "Your time entry has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingAISummary(true);
      const response = await apiRequest("POST", "/api/generate-time-summary", {
        date: today
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-log-summary"] });
      setIsGeneratingAISummary(false);
      toast({
        title: "Daily summary generated",
        description: "Your time log has been analyzed and summarized.",
      });
    },
    onError: () => {
      setIsGeneratingAISummary(false);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTimeSlot = (timeSlot: string) => {
    const [hour, minute] = timeSlot.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute} ${period}`;
  };

  const getEntryForSlot = (timeSlot: string) => {
    return timeEntries.find(entry => entry.timeSlot === timeSlot);
  };

  const handleEditClick = (timeSlot: string, currentActivity?: string) => {
    setEditingSlot(timeSlot);
    setEditingActivity(currentActivity || "");
  };

  const handleSave = () => {
    if (editingSlot && editingActivity.trim()) {
      saveEntryMutation.mutate({
        timeSlot: editingSlot,
        activity: editingActivity
      });
    }
  };

  const handleCancel = () => {
    setEditingSlot(null);
    setEditingActivity("");
  };

  const handleDelete = (entry: TimeLogEntry) => {
    deleteEntryMutation.mutate(entry.id);
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="text-blue-600 text-sm" />
            </div>
            <h3 className="text-lg font-medium text-slate-800">Time Tracker</h3>
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-slate-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card rounded-2xl p-6 border-0 hover-lift transition-all-smooth">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-forest rounded-full flex items-center justify-center animate-gentle-pulse">
            <Clock className="text-white text-sm" />
          </div>
          <h3 className="text-lg font-medium text-gradient-warm">Time Tracker</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {timeEntries.length} entries
          </Badge>
          {timeEntries.length > 0 && (
            <Button
              size="sm"
              onClick={() => generateSummaryMutation.mutate()}
              disabled={isGeneratingAISummary}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {isGeneratingAISummary ? "Generating..." : "AI Summary"}
            </Button>
          )}
        </div>
      </div>

      {/* Today's Summary */}
      {summary && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Today's Summary</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTodaySummary(!showTodaySummary)}
              className="h-auto p-1 text-purple-600 hover:text-purple-800"
            >
              {showTodaySummary ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
          {showTodaySummary && (
            <div className="mt-2">
              <p className="text-sm text-slate-700">{summary.summary}</p>
              <p className="text-xs text-slate-500 mt-1">
                Based on {summary.totalEntries} time entries
              </p>
            </div>
          )}
        </div>
      )}

      {/* Time Slots Grid */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {timeSlots.map((timeSlot, index) => {
          const entry = getEntryForSlot(timeSlot);
          const isEditing = editingSlot === timeSlot;
          const isHourStart = timeSlot.endsWith(':00');
          const showHourDivider = isHourStart && index > 0;

          return (
            <div key={timeSlot}>
              {/* Hour Divider */}
              {showHourDivider && (
                <div className="flex items-center my-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                  <div className="mx-3 text-xs font-medium text-slate-400 bg-white px-2">
                    {formatTimeSlot(timeSlot).split(':')[0] + (formatTimeSlot(timeSlot).includes('PM') ? ' PM' : ' AM')}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                </div>
              )}
              
              <div
                className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className="w-20 text-sm font-medium text-slate-600 flex-shrink-0">
                  {formatTimeSlot(timeSlot)}
                </div>
                
                <div className="flex-1">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={editingActivity}
                      onChange={(e) => setEditingActivity(e.target.value)}
                      placeholder="What are you doing during this time?"
                      className="flex-1 h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSave();
                        } else if (e.key === 'Escape') {
                          handleCancel();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!editingActivity.trim() || saveEntryMutation.isPending}
                      className="h-8 px-2"
                    >
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      className="h-8 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : entry ? (
                  <div className="flex items-center justify-between group">
                    <span className="text-sm text-slate-700 flex-1">{entry.activity}</span>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(timeSlot, entry.activity)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(entry)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditClick(timeSlot)}
                    className="text-sm text-slate-400 hover:text-slate-600 text-left w-full"
                  >
                    Click to add activity...
                  </button>
                )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Past Summaries */}
      {pastSummaries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPastSummaries(!showPastSummaries)}
            className="mb-3 p-0 h-auto font-normal text-slate-600 hover:text-slate-800"
          >
            <div className="flex items-center space-x-2">
              {showPastSummaries ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span>View Past Time Summaries ({pastSummaries.length})</span>
            </div>
          </Button>

          {showPastSummaries && (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {pastSummaries.map((pastSummary) => (
                <div
                  key={pastSummary.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-800">
                      {pastSummary.date}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {pastSummary.totalEntries} entries
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{pastSummary.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}