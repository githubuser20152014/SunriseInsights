import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [content, setContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPastNotes, setShowPastNotes] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: todaysNotes } = useQuery<DailyNotesData>({
    queryKey: ["/api/daily-notes"],
  });

  const { data: searchResults = [] } = useQuery<DailyNotesData[]>({
    queryKey: ["/api/search-notes", searchTerm],
    enabled: !!searchTerm,
  });

  const saveNotesMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/daily-notes", { content });
      return response.json();
    },
    onSuccess: (data: DailyNotesData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/search-notes"] });
      toast({
        title: "Notes saved",
        description: data.summary ? "Your notes have been saved with AI summary." : "Your notes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving notes",
        description: error?.message || "Failed to save notes. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (todaysNotes?.content) {
      setContent(todaysNotes.content);
    }
  }, [todaysNotes]);

  const handleSave = () => {
    if (content.trim()) {
      saveNotesMutation.mutate(content.trim());
    }
  };

  const pastNotes = searchResults.filter((note: DailyNotesData) => 
    note.date !== today && note.content.trim()
  );

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleSave}
        placeholder="What's on your mind today? Jot down ideas, observations, or anything worth remembering..."
        style={{
          width: '100%',
          minHeight: '200px',
          border: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: '16px',
          lineHeight: 1.6,
          resize: 'none',
          background: 'transparent'
        }}
      />

      {todaysNotes?.summary && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '8px',
            margin: 0
          }}>
            ✨ AI Summary & Action Items
          </h4>
          <p style={{
            fontSize: '14px',
            lineHeight: 1.5,
            opacity: 0.95,
            margin: 0
          }}>
            {todaysNotes.summary}
          </p>
        </div>
      )}

      {/* Search past notes */}
      <div style={{ marginTop: '20px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search past notes..."
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>

      {/* Past notes toggle */}
      {pastNotes.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <button
            onClick={() => setShowPastNotes(!showPastNotes)}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {showPastNotes ? '▼' : '▶'} Past Notes ({pastNotes.length})
          </button>

          {showPastNotes && (
            <div style={{ marginTop: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {pastNotes.map((note) => (
                <div key={note.id} style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  borderLeft: '3px solid #667eea'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '5px'
                  }}>
                    {new Date(note.date).toLocaleDateString()}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    lineHeight: 1.4,
                    marginBottom: note.summary ? '8px' : 0
                  }}>
                    {note.content.substring(0, 200)}
                    {note.content.length > 200 && '...'}
                  </div>
                  {note.summary && (
                    <div style={{
                      fontSize: '12px',
                      color: '#667eea',
                      fontStyle: 'italic'
                    }}>
                      Summary: {note.summary.substring(0, 100)}
                      {note.summary.length > 100 && '...'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}