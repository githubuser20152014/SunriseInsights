import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronRight, Clock, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ScrapbookEntry {
  id: number;
  userId: number;
  title: string;
  body: string;
  createdAt: string;
}

// URL detection utility
const urlRegex = /(https?:\/\/[^\s]+)/g;

function extractUrls(text: string): string[] {
  const matches = text.match(urlRegex);
  return matches || [];
}

// Link Preview Component with enhanced styling
function LinkPreview({ url }: { url: string }) {
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const domain = getDomain(url);
  const displayUrl = url.length > 50 ? `${url.substring(0, 50)}...` : url;

  return (
    <div className="mt-2 p-3 border rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <ExternalLink className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-blue-700 mb-1">
            {domain}
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline break-all line-clamp-2"
          >
            {displayUrl}
          </a>
        </div>
      </div>
    </div>
  );
}

// Enhanced text renderer with link detection
function renderBodyContent(body: string) {
  const urls = extractUrls(body);
  
  if (urls.length === 0) {
    return (
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {body}
      </p>
    );
  }

  // Split text by URLs and render with previews
  let remainingText = body;
  const elements: React.ReactNode[] = [];
  let key = 0;

  urls.forEach((url) => {
    const urlIndex = remainingText.indexOf(url);
    
    // Add text before URL
    if (urlIndex > 0) {
      const beforeText = remainingText.substring(0, urlIndex);
      elements.push(
        <span key={key++} className="text-sm text-muted-foreground whitespace-pre-wrap">
          {beforeText}
        </span>
      );
    }
    
    // Add link preview
    elements.push(<LinkPreview key={key++} url={url} />);
    
    // Update remaining text
    remainingText = remainingText.substring(urlIndex + url.length);
  });

  // Add any remaining text
  if (remainingText) {
    elements.push(
      <span key={key++} className="text-sm text-muted-foreground whitespace-pre-wrap">
        {remainingText}
      </span>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}

export function Scrapbook() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery<ScrapbookEntry[]>({
    queryKey: ["/api/scrapbook"],
  });

  const createEntryMutation = useMutation({
    mutationFn: (data: { title: string; body: string }) =>
      apiRequest("POST", "/api/scrapbook", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scrapbook"] });
      setNewTitle("");
      setNewBody("");
      setIsCreating(false);
      toast({
        title: "Entry added",
        description: "Your scrapbook entry has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save scrapbook entry.",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/scrapbook/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scrapbook"] });
      toast({
        title: "Entry deleted",
        description: "Scrapbook entry has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete scrapbook entry.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    
    createEntryMutation.mutate({
      title: newTitle.trim(),
      body: newBody.trim(),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteEntryMutation.mutate(id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          Scrapbook
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Entry Form */}
        {!isCreating ? (
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Entry
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter title..."
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="body">Content</Label>
              <Textarea
                id="body"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Add text, links, or describe a screenshot..."
                className="mt-1 min-h-[100px]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!newTitle.trim() || !newBody.trim() || createEntryMutation.isPending}
                size="sm"
              >
                Save Entry
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewTitle("");
                  setNewBody("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* View Entries Section */}
        {entries.length > 0 && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="text-sm font-medium text-muted-foreground">
                  View All Entries ({entries.length})
                </span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading entries...</div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 border rounded-lg bg-muted/30 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{entry.title}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="h-auto p-1 text-muted-foreground hover:text-destructive"
                        disabled={deleteEntryMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {renderBodyContent(entry.body)}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                ))
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {entries.length === 0 && !isLoading && !isCreating && (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No entries yet</p>
            <p className="text-xs">Start collecting interesting content from the web</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}