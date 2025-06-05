import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sparkles, TrendingUp, Heart, Calendar, ChevronDown, ChevronRight, History } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DailySummary {
  id: number;
  userId: number;
  date: string;
  summary: string;
  highlights: string;
  moodTheme: string;
  productivityScore: number;
  createdAt: string;
  updatedAt: string;
}

export function DailySummary() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: summary, isLoading } = useQuery<DailySummary>({
    queryKey: ['/api/daily-summary', today],
    queryFn: async () => {
      const response = await fetch(`/api/daily-summary?date=${encodeURIComponent(today)}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch summary');
      }
      const data = await response.json();
      return data || null;
    }
  });

  const { data: historySummaries } = useQuery<DailySummary[]>({
    queryKey: ['/api/daily-summary-history'],
    queryFn: async () => {
      const response = await fetch('/api/daily-summary-history?limit=7');
      if (!response.ok) {
        throw new Error('Failed to fetch summary history');
      }
      return response.json();
    },
    enabled: showHistory
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/generate-daily-summary', { date: today });
      return response.json();
    },
    onMutate: () => setIsGenerating(true),
    onSettled: () => setIsGenerating(false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
    }
  });

  const handleGenerateSummary = () => {
    generateSummaryMutation.mutate();
  };

  const formatHighlights = (highlights: string) => {
    if (!highlights) return [];
    
    // Handle JSON array format if present
    if (highlights.startsWith('{') || highlights.startsWith('[')) {
      try {
        const parsed = JSON.parse(highlights);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Fall through to string parsing
      }
    }
    
    // Handle bullet point format
    return highlights
      .split(/[•\n]/)
      .filter(item => item.trim())
      .map(item => item.trim().replace(/^[-*]\s*/, ''));
  };

  const getProductivityColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getMoodThemeColor = (theme: string) => {
    const lowerTheme = theme.toLowerCase();
    if (lowerTheme.includes('joy') || lowerTheme.includes('happy') || lowerTheme.includes('positive')) return "bg-green-100 text-green-800";
    if (lowerTheme.includes('calm') || lowerTheme.includes('peaceful') || lowerTheme.includes('content')) return "bg-blue-100 text-blue-800";
    if (lowerTheme.includes('stress') || lowerTheme.includes('anxious') || lowerTheme.includes('overwhelm')) return "bg-red-100 text-red-800";
    if (lowerTheme.includes('neutral') || lowerTheme.includes('balanced')) return "bg-gray-100 text-gray-800";
    return "bg-purple-100 text-purple-800";
  };

  return (
    <Card className="glass-card rounded-3xl p-6 border-0 hover-lift animate-gentle-pulse">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-sunset rounded-2xl flex items-center justify-center soft-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-medium text-gradient-warm">Today's Summary</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                AI-powered insights from your daily activities
              </CardDescription>
            </div>
          </div>
          
          {!summary && (
            <Button
              onClick={handleGenerateSummary}
              disabled={isGenerating}
              className="glass-button bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 hover:from-amber-600 hover:to-orange-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Summary
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading summary...</span>
          </div>
        )}

        {!isLoading && !summary && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto gradient-warm rounded-full flex items-center justify-center opacity-50">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground mb-2">No summary yet</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Generate an AI-powered summary that analyzes your brain dump, notes, gratitude, mood, reflection, and activities for today.
              </p>
            </div>
          </div>
        )}

        {summary && (
          <div className="space-y-6">
            {/* Summary Overview */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Badge className={`${getMoodThemeColor(summary.moodTheme)} border-0`}>
                  <Heart className="h-3 w-3 mr-1" />
                  {summary.moodTheme}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className="bg-slate-100 text-slate-800 border-0">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Productivity: {summary.productivityScore}/10
                </Badge>
                <div className={`w-2 h-2 rounded-full ${getProductivityColor(summary.productivityScore)}`}></div>
              </div>
            </div>

            <Separator className="opacity-20" />

            {/* Main Summary */}
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center">
                <div className="w-2 h-2 gradient-forest rounded-full mr-2"></div>
                Daily Overview
              </h4>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {summary.summary}
                </p>
              </div>
            </div>

            <Separator className="opacity-20" />

            {/* Highlights */}
            {summary.highlights && (
              <div>
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <div className="w-2 h-2 gradient-sunrise rounded-full mr-2"></div>
                  Key Highlights
                </h4>
                <ul className="space-y-2">
                  {formatHighlights(summary.highlights).map((highlight, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 gradient-warm rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-foreground leading-relaxed">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Section */}
            <div className="flex items-center justify-between pt-4 border-t border-border/20">
              <div className="text-xs text-muted-foreground">
                Generated {new Date(summary.createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
              
              <Button
                onClick={handleGenerateSummary}
                disabled={isGenerating}
                variant="outline"
                size="sm"
                className="glass-button border-border/20 hover:border-border/40"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-2" />
                    Refresh Summary
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Previous Summaries */}
        <Separator className="opacity-20 my-6" />
        
        <Collapsible open={showHistory} onOpenChange={setShowHistory}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
              <div className="flex items-center space-x-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Previous Summaries</span>
              </div>
              {showHistory ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {historySummaries && historySummaries.length > 0 ? (
              historySummaries
                .filter(h => h.date !== today) // Exclude today's summary
                .map((historySummary) => (
                  <div key={historySummary.id} className="p-4 rounded-2xl bg-background/50 border border-border/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-foreground">
                        {new Date(historySummary.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getMoodThemeColor(historySummary.moodTheme)} border-0 text-xs`}>
                          {historySummary.moodTheme}
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-800 border-0 text-xs">
                          {historySummary.productivityScore}/10
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {historySummary.summary}
                    </p>
                    
                    {historySummary.highlights && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-foreground mb-1">Key Highlights:</p>
                        <ul className="space-y-1">
                          {formatHighlights(historySummary.highlights).slice(0, 2).map((highlight, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <div className="w-1 h-1 gradient-warm rounded-full mt-1.5 flex-shrink-0"></div>
                              <span className="text-xs text-muted-foreground leading-relaxed">{highlight}</span>
                            </li>
                          ))}
                          {formatHighlights(historySummary.highlights).length > 2 && (
                            <li className="text-xs text-muted-foreground/60">
                              +{formatHighlights(historySummary.highlights).length - 2} more highlights
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No previous summaries found</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}