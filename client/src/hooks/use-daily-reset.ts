import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useDailyReset() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkForNewDay = () => {
      const now = new Date();
      const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      
      // Get the current date in YYYY-MM-DD format for Eastern Time
      const currentDate = easternTime.toISOString().split('T')[0];
      
      // Check if we have a stored date from the last time the app was used
      const lastDate = localStorage.getItem('lastActiveDate');
      
      if (lastDate && lastDate !== currentDate) {
        // It's a new day - invalidate all date-specific queries
        queryClient.invalidateQueries({ queryKey: ['/api/daily-summary'] });
        queryClient.invalidateQueries({ queryKey: ['/api/daily-notes'] });
        queryClient.invalidateQueries({ queryKey: ['/api/daily-gratitude'] });
        queryClient.invalidateQueries({ queryKey: ['/api/daily-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/time-log'] });
        queryClient.invalidateQueries({ queryKey: ['/api/time-log-summary'] });
        queryClient.invalidateQueries({ queryKey: ['/api/mood-analysis'] });
        
        // Clear any localStorage data that should reset daily
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('daily-mood-') ||
            key.startsWith('daily-notes-') ||
            key.startsWith('daily-reflection-') ||
            key.startsWith('daily-gratitude-')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // Update the last active date
      localStorage.setItem('lastActiveDate', currentDate);
    };

    // Check immediately when the hook is mounted
    checkForNewDay();

    // Set up interval to check every minute for midnight crossover
    const interval = setInterval(checkForNewDay, 60000);

    // Also check when the window gains focus (user comes back to the app)
    const handleFocus = () => {
      checkForNewDay();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);
}