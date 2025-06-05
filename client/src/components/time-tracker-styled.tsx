import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: timeEntries = [] } = useQuery<TimeLogEntry[]>({
    queryKey: ["/api/time-log"],
  });

  const { data: todaysSummary } = useQuery<TimeLogSummary>({
    queryKey: ["/api/time-log-summary"],
  });

  const { data: pastSummaries = [] } = useQuery<TimeLogSummary[]>({
    queryKey: ["/api/time-log-summary-history"],
  });

  const saveEntryMutation = useMutation({
    mutationFn: async ({ timeSlot, activity }: { timeSlot: string; activity: string }) => {
      const response = await apiRequest("POST", "/api/time-log", { timeSlot, activity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-log-summary"] });
      setEditingSlot(null);
      setEditingActivity("");
    },
    onError: (error: any) => {
      toast({
        title: "Error saving time entry",
        description: error?.message || "Failed to save time entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, activity }: { id: number; activity: string }) => {
      const response = await apiRequest("PATCH", `/api/time-log/${id}`, { activity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-log-summary"] });
      setEditingSlot(null);
      setEditingActivity("");
    },
    onError: (error: any) => {
      toast({
        title: "Error updating time entry",
        description: error?.message || "Failed to update time entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/time-log/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-log"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-log-summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting time entry",
        description: error?.message || "Failed to delete time entry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 5; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getEntryForSlot = (timeSlot: string) => {
    return timeEntries.find(entry => entry.timeSlot === timeSlot);
  };

  const formatTimeSlot = (timeSlot: string) => {
    const [hour, minute] = timeSlot.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleEdit = (timeSlot: string, currentActivity: string = "") => {
    setEditingSlot(timeSlot);
    setEditingActivity(currentActivity);
  };

  const handleSave = (timeSlot: string) => {
    if (editingActivity.trim()) {
      const existingEntry = getEntryForSlot(timeSlot);
      if (existingEntry) {
        updateEntryMutation.mutate({ id: existingEntry.id, activity: editingActivity.trim() });
      } else {
        saveEntryMutation.mutate({ timeSlot, activity: editingActivity.trim() });
      }
    }
  };

  const handleDelete = (entry: TimeLogEntry) => {
    deleteEntryMutation.mutate(entry.id);
  };

  const handleKeyPress = (e: React.KeyboardEvent, timeSlot: string) => {
    if (e.key === 'Enter') {
      handleSave(timeSlot);
    } else if (e.key === 'Escape') {
      setEditingSlot(null);
      setEditingActivity("");
    }
  };

  const entriesByTimeSlot = useMemo(() => {
    return timeEntries.reduce((acc, entry) => {
      acc[entry.timeSlot] = entry;
      return acc;
    }, {} as Record<string, TimeLogEntry>);
  }, [timeEntries]);

  return (
    <div>
      {/* Entry count and summary info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <span style={{
          fontSize: '14px',
          color: '#666'
        }}>
          {timeEntries.length} entries
        </span>
        {todaysSummary && (
          <span style={{
            fontSize: '12px',
            color: '#667eea',
            background: '#f0f2ff',
            padding: '4px 8px',
            borderRadius: '6px'
          }}>
            AI Summary Available
          </span>
        )}
      </div>

      {/* Time entries grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '15px',
        marginBottom: '20px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {timeEntries.map((entry) => (
          <div key={entry.id} style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
            borderLeft: '4px solid #667eea'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}>
              <span style={{
                fontWeight: 600,
                color: '#667eea',
                fontSize: '14px'
              }}>
                {formatTimeSlot(entry.timeSlot)}
              </span>
              <span style={{
                fontSize: '12px',
                color: '#666',
                background: '#f0f2ff',
                padding: '4px 8px',
                borderRadius: '6px'
              }}>
                30 min
              </span>
            </div>
            
            {editingSlot === entry.timeSlot ? (
              <input
                type="text"
                value={editingActivity}
                onChange={(e) => setEditingActivity(e.target.value)}
                onBlur={() => handleSave(entry.timeSlot)}
                onKeyDown={(e) => handleKeyPress(e, entry.timeSlot)}
                autoFocus
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px',
                  background: 'transparent',
                  color: '#333'
                }}
              />
            ) : (
              <div
                onClick={() => handleEdit(entry.timeSlot, entry.activity)}
                style={{
                  color: '#333',
                  fontSize: '15px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  minHeight: '20px'
                }}
              >
                {entry.activity}
              </div>
            )}
            
            <button
              onClick={() => handleDelete(entry)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ccc',
                cursor: 'pointer',
                fontSize: '12px',
                float: 'right'
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {todaysSummary && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '20px',
          padding: '25px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            fontSize: '18px',
            marginBottom: '15px',
            fontWeight: 600,
            margin: '0 0 15px 0'
          }}>
            ✨ Today's Summary
          </h3>
          <p style={{
            lineHeight: 1.6,
            opacity: 0.95,
            fontSize: '14px',
            margin: 0
          }}>
            {todaysSummary.summary}
          </p>
        </div>
      )}

      {/* Quick add new entry */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleEdit(e.target.value);
              e.target.value = '';
            }
          }}
          style={{
            padding: '8px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            background: 'white'
          }}
        >
          <option value="">Add time entry...</option>
          {timeSlots.filter(slot => !entriesByTimeSlot[slot]).map(slot => (
            <option key={slot} value={slot}>
              {formatTimeSlot(slot)}
            </option>
          ))}
        </select>
      </div>

      {/* Past summaries */}
      {pastSummaries.length > 0 && (
        <div>
          <button
            onClick={() => setShowPastSummaries(!showPastSummaries)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            {showPastSummaries ? '▼' : '▶'} Past Summaries ({pastSummaries.length})
          </button>

          {showPastSummaries && (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {pastSummaries.map((summary) => (
                <div key={summary.id} style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '15px',
                  marginBottom: '10px',
                  borderLeft: '4px solid #667eea'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    {new Date(summary.date).toLocaleDateString()} • {summary.totalEntries} entries
                  </div>
                  <div style={{
                    fontSize: '14px',
                    lineHeight: 1.5
                  }}>
                    {summary.summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}