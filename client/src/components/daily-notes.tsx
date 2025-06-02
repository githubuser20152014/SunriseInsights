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
  date: string;
  updatedAt?: string;
}

export function DailyNotes() {
  const [notes, setNotes] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

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

  // Update local state when data loads
  useEffect(() => {
    if (notesData?.content) {
      setNotes(notesData.content);
      if (notesData.updatedAt) {
        setLastSaved(new Date(notesData.updatedAt));
      }
    }
  }, [notesData]);

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

  return (
    <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i className="fas fa-edit text-blue-600 text-sm"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-800">Daily Notes</h3>
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
            {notes.trim() && (
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
      
      <div className="space-y-3">
        <Textarea
          placeholder="Jot down thoughts, ideas, reminders, or anything else that comes to mind throughout your day..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[120px] border-0 bg-slate-50 focus:ring-2 focus:ring-blue-500 resize-none"
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