import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyGratitude {
  id?: number;
  content: string;
  date: string;
  updatedAt?: string;
}

export function DailyGratitude() {
  const [content, setContent] = useState("");
  const [showPastGratitude, setShowPastGratitude] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: todaysGratitude } = useQuery<DailyGratitude>({
    queryKey: ["/api/daily-gratitude"],
  });

  const { data: searchResults = [] } = useQuery<DailyGratitude[]>({
    queryKey: ["/api/search-gratitude", ""],
  });

  const saveGratitudeMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/daily-gratitude", { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-gratitude"] });
      queryClient.invalidateQueries({ queryKey: ["/api/search-gratitude"] });
      toast({
        title: "Gratitude saved",
        description: "Your gratitude entries have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving gratitude",
        description: error?.message || "Failed to save gratitude. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (todaysGratitude?.content) {
      setContent(todaysGratitude.content);
    }
  }, [todaysGratitude]);

  const handleSave = () => {
    if (content.trim()) {
      saveGratitudeMutation.mutate(content.trim());
    }
  };

  // Parse gratitude items from content
  const gratitudeItems = content
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(item => item.length > 0);

  const pastGratitude = searchResults.filter((entry: DailyGratitude) => 
    entry.content.trim() && entry.date !== today
  );

  const getEmojiForGratitude = (text: string): string => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('sleep') || lowerText.includes('rest')) return '😴';
    if (lowerText.includes('money') || lowerText.includes('profit') || lowerText.includes('$')) return '💰';
    if (lowerText.includes('energy') || lowerText.includes('energized')) return '⚡';
    if (lowerText.includes('health') || lowerText.includes('headache')) return '💚';
    if (lowerText.includes('family') || lowerText.includes('friend')) return '👨‍👩‍👧‍👦';
    if (lowerText.includes('work') || lowerText.includes('job')) return '💼';
    if (lowerText.includes('food') || lowerText.includes('meal')) return '🍽️';
    if (lowerText.includes('weather') || lowerText.includes('sun')) return '☀️';
    return '🙏';
  };

  return (
    <div>
      {/* Display gratitude items if they exist */}
      {gratitudeItems.length > 0 ? (
        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 20px 0'
        }}>
          {gratitudeItems.map((item, index) => (
            <li key={index} style={{
              display: 'flex',
              alignItems: 'flex-start',
              marginBottom: '15px',
              padding: '10px',
              background: '#fff8e1',
              borderRadius: '10px',
              borderLeft: '4px solid #ffc107'
            }}>
              <span style={{
                marginRight: '10px',
                fontSize: '18px'
              }}>
                {getEmojiForGratitude(item)}
              </span>
              <span style={{
                flex: 1,
                fontSize: '14px',
                lineHeight: 1.4
              }}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#999',
          fontSize: '14px',
          fontStyle: 'italic',
          marginBottom: '20px'
        }}>
          Add your gratitude entries below
        </div>
      )}

      {/* Gratitude input */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleSave}
        placeholder="What are you grateful for today?&#10;&#10;- Use bullet points with dashes&#10;- Add one thing per line&#10;- Be specific and heartfelt"
        style={{
          width: '100%',
          minHeight: '100px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px',
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          lineHeight: 1.5
        }}
      />

      {/* Past gratitude toggle */}
      {pastGratitude.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setShowPastGratitude(!showPastGratitude)}
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
            {showPastGratitude ? '▼' : '▶'} Past Gratitude ({pastGratitude.length})
          </button>

          {showPastGratitude && (
            <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
              {pastGratitude.map((entry) => (
                <div key={entry.id} style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  borderLeft: '3px solid #ffc107'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '5px'
                  }}>
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    lineHeight: 1.4
                  }}>
                    {entry.content}
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