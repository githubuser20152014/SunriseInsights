import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyNotesData {
  id?: number;
  content: string;
  summary?: string;
  date: string;
  updatedAt?: string;
}

export function DailyNotes() {
  const [notes, setNotes] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [viewingPastNote, setViewingPastNote] = useState<DailyNotesData | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showPastSummaries, setShowPastSummaries] = useState(false);
  const [showPastNotes, setShowPastNotes] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Get today's date in Eastern Time for proper daily reset
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

  // Load notes from database
  const { data: notesData } = useQuery<DailyNotesData>({
    queryKey: ["/api/daily-notes", today],
    queryFn: async () => {
      const response = await fetch(`/api/daily-notes?date=${today}`);
      return response.json();
    },
  });

  // Search past notes
  const { data: searchResults, refetch: searchNotes } = useQuery<DailyNotesData[]>({
    queryKey: ["/api/search-notes", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const response = await fetch(`/api/search-notes?q=${encodeURIComponent(searchTerm)}`);
      return response.json();
    },
    enabled: false, // Only run when manually triggered
  });

  // Load past summaries
  const { data: pastSummaries } = useQuery<DailyNotesData[]>({
    queryKey: ["/api/past-summaries"],
    queryFn: async () => {
      const response = await fetch("/api/search-notes?q=.");
      const results = await response.json();
      return results.filter((note: DailyNotesData) => note.summary);
    },
  });

  // Load all past notes
  const { data: allPastNotes } = useQuery<DailyNotesData[]>({
    queryKey: ["/api/all-past-notes"],
    queryFn: async () => {
      const response = await fetch("/api/search-notes?q=.");
      const results = await response.json();
      return results.filter((note: DailyNotesData) => note.date !== today && note.content.trim());
    },
  });

  // Update local state when data loads, including clearing for new day
  useEffect(() => {
    if (notesData && !viewingPastNote) {
      setNotes(notesData.content || "");
      if (notesData.updatedAt) {
        setLastSaved(new Date(notesData.updatedAt));
      } else {
        setLastSaved(null);
      }
      // Clear AI summary when switching days
      setAiSummary(null);
    }
  }, [notesData, today]);

  // Update state when viewing a past note
  useEffect(() => {
    if (viewingPastNote) {
      setNotes(viewingPastNote.content || "");
      if (viewingPastNote.updatedAt) {
        setLastSaved(new Date(viewingPastNote.updatedAt));
      } else {
        setLastSaved(null);
      }
      // Show AI summary if available for past note
      setAiSummary(viewingPastNote.summary || null);
    }
  }, [viewingPastNote]);

  const saveNotesMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/daily-notes", {
        content,
        date: today,
      });
      return response.json();
    },
    onSuccess: (data: DailyNotesData) => {
      if (data.updatedAt) {
        setLastSaved(new Date(data.updatedAt));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/daily-notes", today] });
      
      toast({
        title: "Notes saved",
        description: "Your daily notes have been saved and synced across devices.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveNotes = () => {
    if (notes.trim()) {
      saveNotesMutation.mutate(notes.trim());
    }
  };

  const clearNotes = () => {
    setNotes("");
    setLastSaved(null);
    saveNotesMutation.mutate("");
  };

  const handleSearch = () => {
    if (searchTerm && searchTerm.length >= 2) {
      searchNotes();
    }
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

  const generateSummary = async () => {
    if (!notes.trim()) {
      toast({
        title: "No content to summarize",
        description: "Please add some notes before generating a summary.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const response = await fetch('/api/summarize-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: notes, date: today }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setAiSummary(data.summary);
      // Update the current notes data to include the summary
      queryClient.invalidateQueries({ queryKey: ["/api/daily-notes", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/search-notes"] });
      toast({
        title: "Summary generated",
        description: "AI has analyzed your notes and created a summary.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <Card className="glass-card rounded-2xl p-6 border-0 hover-lift transition-all-smooth">
      <div className="space-y-4 mb-4">
        {viewingPastNote && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <i className="fas fa-history text-amber-600"></i>
                <span className="text-sm text-amber-800">
                  Viewing note from {formatDate(viewingPastNote.date)}
                </span>
              </div>
              <Button
                onClick={() => {
                  setViewingPastNote(null);
                  setNotes(notesData?.content || "");
                }}
                variant="ghost"
                size="sm"
                className="text-amber-700 hover:text-amber-900"
              >
                <i className="fas fa-arrow-left mr-1"></i>
                Return to Today
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-forest rounded-full flex items-center justify-center animate-gentle-pulse">
              <i className="fas fa-edit text-white text-sm"></i>
            </div>
            <h3 className="text-lg font-medium text-gradient-warm">
              {viewingPastNote ? `Notes from ${formatDate(viewingPastNote.date)}` : "Daily Notes"}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowSearch(!showSearch)}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-700"
            >
              <i className="fas fa-search mr-1"></i>
              Search
            </Button>
            {viewingPastNote && (
              <Button
                onClick={() => {
                  setViewingPastNote(null);
                  setAiSummary(null);
                  // Restore today's notes content
                  if (notesData) {
                    setNotes(notesData.content || "");
                    if (notesData.updatedAt) {
                      setLastSaved(new Date(notesData.updatedAt));
                    } else {
                      setLastSaved(null);
                    }
                  }
                }}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <i className="fas fa-arrow-left mr-1"></i>
                Back to Today
              </Button>
            )}
            {!viewingPastNote && notes.trim() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNotes}
                className="text-xs text-slate-500 hover:text-red-600"
              >
                <i className="fas fa-trash mr-1"></i>
                Clear
              </Button>
            )}
            {!viewingPastNote && (
              <>
                <Button
                  onClick={generateSummary}
                  disabled={isGeneratingSummary || !notes.trim()}
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  {isGeneratingSummary ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-brain mr-2"></i>
                      Generate Summary
                    </>
                  )}
                </Button>
                <Button
                  onClick={saveNotes}
                  disabled={saveNotesMutation.isPending || !notes.trim()}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {saveNotesMutation.isPending ? (
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
              </>
            )}
          </div>
        </div>

        {showSearch && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-700">Search Past Notes</h4>
              <Button
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm("");
                  // Load today's notes back
                  if (notesData?.content) {
                    setNotes(notesData.content);
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-700"
              >
                <i className="fas fa-times mr-1"></i>
                Close
              </Button>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search your past notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={handleSearch}
                disabled={!searchTerm || searchTerm.length < 2}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                Search
              </Button>
            </div>
            
            {searchResults && searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                <h4 className="text-sm font-medium text-slate-700">Search Results:</h4>
                {searchResults.map((result) => (
                  <div 
                    key={result.id} 
                    className="bg-white rounded p-3 border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      setNotes(result.content);
                      setViewingPastNote(result);
                      setShowSearch(false);
                    }}
                  >
                    <div className="text-xs text-slate-500 mb-1">
                      {formatDate(result.date)}
                    </div>
                    <div className="text-sm text-slate-700">
                      {result.content.length > 200 
                        ? `${result.content.substring(0, 200)}...`
                        : result.content
                      }
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Click to view full note
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {searchResults && searchResults.length === 0 && searchTerm.length >= 2 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                No notes found containing "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>



      {/* Past Summaries Section */}
      {pastSummaries && pastSummaries.length > 0 && (
        <div className="mb-4">
          <Button
            onClick={() => setShowPastSummaries(!showPastSummaries)}
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-800 p-0"
          >
            <i className={`fas ${showPastSummaries ? 'fa-chevron-down' : 'fa-chevron-right'} mr-2`}></i>
            View Past Summaries ({pastSummaries.length})
          </Button>
          
          {showPastSummaries && (
            <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
              {pastSummaries.slice().reverse().map((result) => (
                <div key={result.id} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-500">
                      {formatDate(result.date)}
                    </div>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {result.summary}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Summary Display */}
      {aiSummary && (
        <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-brain text-purple-600 text-sm"></i>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-slate-800 mb-2">AI Summary & Action Items</h4>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {aiSummary}
              </div>
            </div>
            <Button
              onClick={() => setAiSummary(null)}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-600"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <Textarea
          placeholder={viewingPastNote ? "This is a past note (read-only)" : "Jot down thoughts, ideas, reminders, or anything else that comes to mind throughout your day..."}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!!viewingPastNote}
          className={`min-h-[120px] border-0 focus:ring-2 focus:ring-blue-500 resize-none ${
            viewingPastNote ? "bg-slate-100 cursor-not-allowed text-slate-600" : "bg-slate-50"
          }`}
        />
        
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span>{notes.length} characters</span>
            {notes.trim() && (
              <span>{notes.trim().split(/\s+/).length} words</span>
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

      {/* Collapsible Past Notes Section */}
      {!viewingPastNote && allPastNotes && allPastNotes.length > 0 && (
        <div className="mt-4">
          <Button
            onClick={() => setShowPastNotes(!showPastNotes)}
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-800 p-0 h-auto font-normal"
          >
            <i className={`fas ${showPastNotes ? 'fa-chevron-down' : 'fa-chevron-right'} mr-2 text-xs`}></i>
            View Past Notes ({allPastNotes.length})
          </Button>
          
          {showPastNotes && (
            <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
              {allPastNotes.slice(0, 10).map((note) => (
                <div 
                  key={note.id} 
                  className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => {
                    setViewingPastNote(note);
                    setShowPastNotes(false);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-500 font-medium">
                      {formatDate(note.date)}
                    </div>
                    {note.summary && (
                      <div className="text-xs text-purple-600 flex items-center">
                        <i className="fas fa-brain mr-1"></i>
                        AI Summary
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {note.content.length > 120 
                      ? `${note.content.substring(0, 120)}...`
                      : note.content
                    }
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    Click to view full note
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <i className="fas fa-lightbulb text-blue-600 text-sm mt-0.5"></i>
          <div className="text-xs text-blue-700">
            <strong>Quick tip:</strong> Your notes are saved permanently and searchable across all days. Use this space for capturing ideas, tracking thoughts, or noting important moments - you can always find them later using the search feature.
          </div>
        </div>
      </div>
    </Card>
  );
}