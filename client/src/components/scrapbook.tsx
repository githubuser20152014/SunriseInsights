import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ChevronDown, ChevronRight, Clock, ExternalLink, ImageIcon, X, Tag, Search, Edit3, Check } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ScrapbookEntry {
  id: number;
  userId: number;
  title: string;
  body: string;
  imageUrl?: string;
  tags?: string[];
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
  const [newTags, setNewTags] = useState("");
  const [searchTags, setSearchTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<number | null>(null);
  const [editTags, setEditTags] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery<ScrapbookEntry[]>({
    queryKey: ["/api/scrapbook"],
  });

  const { data: allTags = [] } = useQuery<string[]>({
    queryKey: ["/api/scrapbook/tags"],
  });

  const { data: searchResults = entries } = useQuery<ScrapbookEntry[]>({
    queryKey: ["/api/scrapbook/search", searchTags, entries.length, JSON.stringify(entries)],
    queryFn: async () => {
      if (!searchTags.trim()) return entries;
      const tagArray = searchTags.split(/[,\s]+/).filter(tag => tag.trim().length > 0);
      const params = new URLSearchParams();
      tagArray.forEach(tag => params.append('tags', tag));
      const response = await fetch(`/api/scrapbook/search?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error('Failed to search entries');
      return response.json();
    },
    enabled: !!entries.length,
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: { title: string; body: string; tags?: string; file?: File }) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('body', data.body);
      if (data.tags) {
        formData.append('tags', data.tags);
      }
      if (data.file) {
        formData.append('image', data.file);
      }
      
      const response = await fetch("/api/scrapbook", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scrapbook"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scrapbook/tags"] });
      setNewTitle("");
      setNewBody("");
      setNewTags("");
      setSelectedFile(null);
      setPreviewUrl(null);
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

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, tags }: { id: number; tags: string }) =>
      apiRequest("PATCH", `/api/scrapbook/${id}`, { tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scrapbook"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scrapbook/tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scrapbook/search"] });
      setEditingEntry(null);
      setEditTags("");
      toast({
        title: "Tags updated",
        description: "Entry tags have been updated.",
      });
    },
    onError: (error) => {
      console.error("Tag update error:", error);
      toast({
        title: "Error",
        description: "Failed to update entry tags.",
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



  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processFile(file);
          toast({
            title: "Image pasted",
            description: "Screenshot has been added to your entry.",
          });
        }
        break;
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    
    createEntryMutation.mutate({
      title: newTitle.trim(),
      body: newBody.trim(),
      tags: newTags.trim() || undefined,
      file: selectedFile || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteEntryMutation.mutate(id);
    }
  };

  const handleEditTags = (entry: ScrapbookEntry) => {
    setEditingEntry(entry.id);
    setEditTags(entry.tags?.join(' ') || '');
  };

  const handleSaveTags = (id: number) => {
    updateEntryMutation.mutate({ id, tags: editTags });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditTags('');
  };

  return (
    <Card className="glass-card rounded-2xl p-6 border-0 hover-lift transition-all-smooth">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-forest rounded-full flex items-center justify-center animate-gentle-pulse">
            <i className="fas fa-bookmark text-white text-sm"></i>
          </div>
          <h3 className="text-lg font-medium text-gradient-warm">Scrapbook</h3>
        </div>
        <span className="text-sm text-slate-500">Collect interesting content</span>
      </div>
      <div className="space-y-4">
        {/* Search by Tags */}
        <div>
          <Label htmlFor="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search by Tags
          </Label>
          <Input
            id="search"
            value={searchTags}
            onChange={(e) => setSearchTags(e.target.value)}
            placeholder="Enter tags to search (space or comma separated)..."
            className="mt-1"
          />
        </div>

        {/* Add New Entry Form */}
        {!isCreating ? (
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 border-slate-300 transition-all-smooth"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Entry
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-slate-700">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter title..."
                className="mt-1 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-slate-400 transition-all-smooth"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="body" className="text-sm font-medium text-slate-700">Content</Label>
              <Textarea
                id="body"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                onPaste={handlePaste}
                placeholder="Add text, links, or paste screenshots directly (Ctrl+V)..."
                className="mt-1 min-h-[100px] bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 focus:border-slate-400 transition-all-smooth"
              />
            </div>
            
            <div>
              <Label htmlFor="tags" className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </Label>
              <Input
                id="tags"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="Add tags separated by spaces or commas..."
                className="mt-1"
              />
              {allTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Existing tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {allTags.slice(0, 10).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-muted"
                        onClick={() => {
                          const currentTags = newTags.split(/[,\s]+/).filter(t => t.trim());
                          if (!currentTags.includes(tag)) {
                            setNewTags(currentTags.concat(tag).join(' '));
                          }
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Image Preview Section */}
            {selectedFile && previewUrl && (
              <div>
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Attached Image
                </Label>
                <div className="mt-1 space-y-2">
                  <div className="relative rounded-lg border overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-32 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeFile}
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              </div>
            )}
            
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
                  setSelectedFile(null);
                  setPreviewUrl(null);
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
                  {searchTags.trim() ? `Search Results (${searchResults.length})` : `View All Entries (${entries.length})`}
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
              ) : searchResults.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {searchTags.trim() ? "No entries found with those tags." : "No entries yet."}
                </div>
              ) : (
                searchResults.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 space-y-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:from-slate-100 hover:to-slate-200 hover-lift transition-all-smooth"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{entry.title}</h4>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTags(entry)}
                          className="h-auto p-1 text-muted-foreground hover:text-primary"
                          disabled={editingEntry === entry.id || updateEntryMutation.isPending}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
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
                    </div>
                    {renderBodyContent(entry.body)}
                    {editingEntry === entry.id ? (
                      <div className="mt-2 space-y-2">
                        <div>
                          <Label htmlFor={`edit-tags-${entry.id}`} className="text-xs text-muted-foreground">
                            Edit Tags
                          </Label>
                          <Input
                            id={`edit-tags-${entry.id}`}
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            placeholder="Enter tags separated by spaces or commas..."
                            className="text-xs"
                          />
                          {allTags.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-muted-foreground mb-1">Click to add:</p>
                              <div className="flex flex-wrap gap-1">
                                {allTags.slice(0, 8).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs cursor-pointer hover:bg-muted"
                                    onClick={() => {
                                      const currentTags = editTags.split(/[,\s]+/).filter(t => t.trim());
                                      if (!currentTags.includes(tag)) {
                                        setEditTags(currentTags.concat(tag).join(' '));
                                      }
                                    }}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleSaveTags(entry.id)}
                            disabled={updateEntryMutation.isPending}
                            className="h-6 px-2 text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updateEntryMutation.isPending}
                            className="h-6 px-2 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : entry.tags && entry.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 border-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs text-muted-foreground border-slate-300">
                          No tags
                        </Badge>
                      </div>
                    )}
                    {entry.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={entry.imageUrl}
                          alt="Scrapbook entry"
                          className="w-full max-h-64 object-cover rounded-lg border"
                          loading="lazy"
                        />
                      </div>
                    )}
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
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <i className="fas fa-lightbulb text-blue-600 text-sm mt-0.5"></i>
          <div className="text-xs text-blue-700">
            <strong>Scrapbook tip:</strong> Save interesting links, paste images directly, and organize with tags. Your content is searchable and permanently stored for future reference.
          </div>
        </div>
      </div>
    </Card>
  );
}