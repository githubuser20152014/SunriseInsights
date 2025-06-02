import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyTask {
  id: number;
  text: string;
  completed: boolean;
  date: string;
  createdAt: string;
}

export function DailyTasks() {
  const [newTaskText, setNewTaskText] = useState("");
  const [sortedTasks, setSortedTasks] = useState<DailyTask[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  // Sort tasks: incomplete first, then completed at bottom
  useEffect(() => {
    const sorted = [...tasks].sort((a, b) => {
      if (a.completed === b.completed) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return a.completed ? 1 : -1;
    });
    setSortedTasks(sorted);
  }, [tasks]);

  const createTaskMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/daily-tasks", { text });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      setNewTaskText("");
      toast({
        title: "Task added",
        description: "Your new task has been added to today's list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/daily-tasks/${id}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/daily-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      toast({
        title: "Task deleted",
        description: "Your task has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleAddTask = () => {
    if (newTaskText.trim() && tasks.length < 3) {
      createTaskMutation.mutate(newTaskText.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  const toggleTask = (id: number, completed: boolean) => {
    updateTaskMutation.mutate({ id, completed: !completed });
  };

  const deleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedItem(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItem === null) return;
    
    const dragIndex = sortedTasks.findIndex(task => task.id === draggedItem);
    if (dragIndex === dropIndex) return;
    
    const newTasks = [...sortedTasks];
    const draggedTask = newTasks[dragIndex];
    
    // Remove from old position
    newTasks.splice(dragIndex, 1);
    // Insert at new position
    newTasks.splice(dropIndex, 0, draggedTask);
    
    setSortedTasks(newTasks);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <i className="fas fa-list-check text-purple-600 text-sm"></i>
            </div>
            <h3 className="text-lg font-medium text-slate-800">Today's Focus</h3>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Max 3 tasks</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-slate-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <i className="fas fa-list-check text-purple-600 text-sm"></i>
          </div>
          <h3 className="text-lg font-medium text-slate-800">Today's Focus</h3>
        </div>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
          {tasks.length}/3 tasks
        </span>
      </div>

      <div className="space-y-3">
        {/* Existing Tasks */}
        {sortedTasks.map((task, index) => (
          <div 
            key={task.id} 
            className={`flex items-start space-x-3 p-3 bg-slate-50 rounded-xl transition-all duration-200 ${
              draggedItem === task.id ? 'opacity-50 scale-95' : 'hover:bg-slate-100'
            } ${!task.completed ? 'cursor-move' : ''}`}
            draggable={!task.completed}
            onDragStart={(e) => !task.completed && handleDragStart(e, task.id)}
            onDragOver={!task.completed ? handleDragOver : undefined}
            onDrop={(e) => !task.completed && handleDrop(e, index)}
            onDragEnd={!task.completed ? handleDragEnd : undefined}
          >
            <div className="flex items-center space-x-2">
              {!task.completed && (
                <i className="fas fa-grip-vertical text-slate-400 text-xs cursor-move" title="Drag to reorder"></i>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 sm:w-5 sm:h-5 p-0 border-2 border-slate-300 rounded-full flex items-center justify-center hover:border-emerald-500 transition-colors min-h-[1.5rem] min-w-[1.5rem] sm:min-h-[1.25rem] sm:min-w-[1.25rem]"
                onClick={() => toggleTask(task.id, task.completed)}
              >
                {task.completed && (
                  <i className="fas fa-check text-emerald-500 text-xs"></i>
                )}
              </Button>
            </div>
            <div className="flex-1">
              <p className={`text-slate-700 ${task.completed ? 'line-through text-slate-500' : ''}`}>
                {task.text}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-red-500 transition-colors p-2 sm:p-1 min-h-[2rem] min-w-[2rem] sm:min-h-[1.5rem] sm:min-w-[1.5rem]"
              onClick={() => deleteTask(task.id)}
            >
              <i className="fas fa-times text-sm"></i>
            </Button>
          </div>
        ))}

        {/* Add New Task */}
        {tasks.length < 3 && (
          <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
            <div className="w-5 h-5 border-2 border-slate-300 rounded-full flex items-center justify-center">
              <i className="fas fa-plus text-slate-400 text-xs"></i>
            </div>
            <Input
              type="text"
              placeholder="Add a task for today..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-none bg-transparent focus:ring-0 focus:border-none shadow-none p-0"
              disabled={createTaskMutation.isPending}
            />
          </div>
        )}

        {tasks.length === 3 && (
          <div className="text-center py-2">
            <p className="text-xs text-slate-500">
              You've reached the maximum of 3 tasks for today. Focus on completing these!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
