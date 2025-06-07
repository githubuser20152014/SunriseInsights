import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DailyTask {
  id: number;
  text: string;
  completed: boolean;
  date: string;
  createdAt: string;
  type?: 'task' | 'habit' | 'learn';
}

export function DailyTasks() {
  const [newTaskText, setNewTaskText] = useState("");
  const [newHabitText, setNewHabitText] = useState("");
  const [newLearnText, setNewLearnText] = useState("");
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  // Separate and sort tasks, habits, and learn items
  const { sortedTasks, sortedHabits, sortedLearn } = useMemo(() => {
    const taskItems = tasks.filter(item => !item.type || item.type === 'task');
    const habitItems = tasks.filter(item => item.type === 'habit');
    const learnItems = tasks.filter(item => item.type === 'learn');
    
    const sortItems = (items: DailyTask[]) => 
      [...items].sort((a, b) => {
        if (a.completed === b.completed) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return a.completed ? 1 : -1;
      });

    return {
      sortedTasks: sortItems(taskItems),
      sortedHabits: sortItems(habitItems),
      sortedLearn: sortItems(learnItems)
    };
  }, [tasks]);

  const canAddTask = sortedTasks.length < 3;
  const canAddHabit = sortedHabits.length < 3;
  const canAddLearn = sortedLearn.length < 1;

  const createTaskMutation = useMutation({
    mutationFn: async ({ text, type }: { text: string; type: 'task' | 'habit' | 'learn' }) => {
      const response = await apiRequest("POST", "/api/daily-tasks", { text, type });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      if (variables.type === 'task') {
        setNewTaskText("");
      } else if (variables.type === 'habit') {
        setNewHabitText("");
      } else {
        setNewLearnText("");
      }
      const typeTitle = variables.type === 'task' ? "Task added" : 
                       variables.type === 'habit' ? "Habit added" : "Learning goal added";
      toast({
        title: typeTitle,
        description: `Your new ${variables.type} has been added to today's list.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
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

  const editTaskMutation = useMutation({
    mutationFn: async ({ id, text }: { id: number; text: string }) => {
      const response = await apiRequest("PATCH", `/api/daily-tasks/${id}`, { text });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      setEditingTask(null);
      setEditText("");
      toast({
        title: "Task updated",
        description: "Your task has been updated.",
      });
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
    if (newTaskText.trim() && canAddTask) {
      createTaskMutation.mutate({ text: newTaskText.trim(), type: 'task' });
    }
  };

  const handleAddHabit = () => {
    if (newHabitText.trim() && canAddHabit) {
      createTaskMutation.mutate({ text: newHabitText.trim(), type: 'habit' });
    }
  };

  const handleAddLearn = () => {
    if (newLearnText.trim() && canAddLearn) {
      createTaskMutation.mutate({ text: newLearnText.trim(), type: 'learn' });
    }
  };

  const handleTaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  const handleHabitKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddHabit();
    }
  };

  const handleLearnKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddLearn();
    }
  };

  const toggleTask = (id: number, completed: boolean) => {
    updateTaskMutation.mutate({ id, completed: !completed });
  };

  const deleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const startEditing = (task: DailyTask) => {
    setEditingTask(task.id);
    setEditText(task.text);
  };

  const saveEdit = () => {
    if (editText.trim() && editingTask) {
      editTaskMutation.mutate({ id: editingTask, text: editText.trim() });
    }
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditText("");
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
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
    setDraggedItem(null);
    // Note: Drag and drop reordering would require backend support for task ordering
    // For now, we'll just clear the drag state
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (isLoading) {
    return (
      <Card className="glass-card rounded-2xl p-6 border-0 hover-lift">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-forest rounded-full flex items-center justify-center animate-gentle-pulse">
              <i className="fas fa-list-check text-white text-sm"></i>
            </div>
            <h3 className="text-lg font-medium text-gradient-warm">Today's Focus</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">Max 3 tasks</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton rounded-xl h-12"></div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card rounded-2xl p-6 border-0 hover-lift transition-all-smooth">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-forest rounded-full flex items-center justify-center animate-gentle-pulse">
            <i className="fas fa-list-check text-white text-sm"></i>
          </div>
          <h3 className="text-lg font-medium text-gradient-warm">Today's Focus</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
          {sortedTasks.length + sortedHabits.length + sortedLearn.length}/7 items
        </span>
      </div>

      <div className="space-y-4">
        {/* Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Tasks</h4>
            <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
              {sortedTasks.length}/3
            </span>
          </div>
          
          {sortedTasks.map((task, index) => (
            <div 
            key={task.id} 
            className={`group flex items-start space-x-3 p-3 bg-secondary/50 rounded-xl transition-all-smooth hover-lift ${
              draggedItem === task.id ? 'opacity-50 scale-95' : 'hover:bg-secondary/70'
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
              {editingTask === task.id ? (
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyPress}
                  onBlur={saveEdit}
                  className="border-none bg-transparent focus:ring-1 focus:ring-blue-300 focus:border-blue-300 shadow-none p-0 text-slate-700"
                  autoFocus
                />
              ) : (
                <p 
                  className={`text-slate-700 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 transition-colors ${task.completed ? 'line-through text-slate-500' : ''}`}
                  onClick={() => !task.completed && startEditing(task)}
                  title={!task.completed ? "Click to edit" : ""}
                >
                  {task.text}
                </p>
              )}
            </div>
            
            {editingTask === task.id ? (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-500 hover:text-green-600 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem]"
                  onClick={saveEdit}
                  disabled={editTaskMutation.isPending}
                >
                  <i className="fas fa-check text-xs"></i>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem]"
                  onClick={cancelEdit}
                >
                  <i className="fas fa-times text-xs"></i>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!task.completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem] bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600"
                    onClick={() => startEditing(task)}
                    title="Edit task"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      <path d="m15 5 4 4"/>
                    </svg>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem] bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600"
                  onClick={() => deleteTask(task.id)}
                  title="Delete task"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    <line x1="10" x2="10" y1="11" y2="17"/>
                    <line x1="14" x2="14" y1="11" y2="17"/>
                  </svg>
                </Button>
              </div>
            )}
          </div>
        ))}

          {/* Add New Task */}
          {canAddTask && (
            <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
              <div className="w-5 h-5 border-2 border-slate-300 rounded-full flex items-center justify-center">
                <i className="fas fa-plus text-slate-400 text-xs"></i>
              </div>
              <Input
                type="text"
                placeholder="Add a task for today..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={handleTaskKeyPress}
                className="flex-1 border-none bg-transparent focus:ring-0 focus:border-none shadow-none p-0"
                disabled={createTaskMutation.isPending}
              />
            </div>
          )}
        </div>

        {/* Divider */}
        <Separator className="my-4" />

        {/* Habits Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Habits</h4>
            <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
              {sortedHabits.length}/3
            </span>
          </div>
          
          {sortedHabits.map((habit, index) => (
            <div 
              key={habit.id} 
              className={`group flex items-start space-x-3 p-3 bg-secondary/50 rounded-xl transition-all-smooth hover-lift ${
                draggedItem === habit.id ? 'opacity-50 scale-95' : 'hover:bg-secondary/70'
              } ${!habit.completed ? 'cursor-move' : ''}`}
              draggable={!habit.completed}
              onDragStart={(e) => !habit.completed && handleDragStart(e, habit.id)}
              onDragOver={!habit.completed ? handleDragOver : undefined}
              onDrop={(e) => !habit.completed && handleDrop(e, index)}
              onDragEnd={!habit.completed ? handleDragEnd : undefined}
            >
              <div className="flex items-center space-x-2">
                {!habit.completed && (
                  <i className="fas fa-grip-vertical text-slate-400 text-xs cursor-move" title="Drag to reorder"></i>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 sm:w-5 sm:h-5 p-0 border-2 border-slate-300 rounded-full flex items-center justify-center hover:border-emerald-500 transition-colors min-h-[1.5rem] min-w-[1.5rem] sm:min-h-[1.25rem] sm:min-w-[1.25rem]"
                  onClick={() => toggleTask(habit.id, habit.completed)}
                >
                  {habit.completed && (
                    <i className="fas fa-check text-emerald-500 text-xs"></i>
                  )}
                </Button>
              </div>
              <div className="flex-1">
                {editingTask === habit.id ? (
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKeyPress}
                    onBlur={saveEdit}
                    className="border-none bg-transparent focus:ring-1 focus:ring-blue-300 focus:border-blue-300 shadow-none p-0 text-slate-700"
                    autoFocus
                  />
                ) : (
                  <p 
                    className={`text-slate-700 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 transition-colors ${habit.completed ? 'line-through text-slate-500' : ''}`}
                    onClick={() => !habit.completed && startEditing(habit)}
                    title={!habit.completed ? "Click to edit" : ""}
                  >
                    {habit.text}
                  </p>
                )}
              </div>
              {editingTask === habit.id ? (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-600 hover:text-emerald-700 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem]"
                    onClick={saveEdit}
                    title="Save changes"
                  >
                    <i className="fas fa-check text-xs"></i>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-slate-600 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem]"
                    onClick={cancelEdit}
                    title="Cancel"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!habit.completed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem] bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600"
                      onClick={() => startEditing(habit)}
                      title="Edit habit"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        <path d="m15 5 4 4"/>
                      </svg>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem] bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600"
                    onClick={() => deleteTask(habit.id)}
                    title="Delete habit"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      <line x1="10" x2="10" y1="11" y2="17"/>
                      <line x1="14" x2="14" y1="11" y2="17"/>
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Add New Habit */}
          {canAddHabit && (
            <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
              <div className="w-5 h-5 border-2 border-slate-300 rounded-full flex items-center justify-center">
                <i className="fas fa-plus text-slate-400 text-xs"></i>
              </div>
              <Input
                type="text"
                placeholder="Add a habit for today..."
                value={newHabitText}
                onChange={(e) => setNewHabitText(e.target.value)}
                onKeyPress={handleHabitKeyPress}
                className="flex-1 border-none bg-transparent focus:ring-0 focus:border-none shadow-none p-0"
                disabled={createTaskMutation.isPending}
              />
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Learn Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Learn</h4>
            <span className="text-xs text-muted-foreground">
              {sortedLearn.length}/1
            </span>
          </div>
          
          {sortedLearn.map((learn, index) => (
            <div
              key={learn.id}
              className={`group flex items-center justify-between space-x-3 p-3 rounded-xl transition-all-smooth border ${
                learn.completed 
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                  : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}
              draggable={!editingTask}
              onDragStart={() => setDraggedItem(learn.id)}
              onDragEnd={() => setDraggedItem(null)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div
                  onClick={() => toggleTask(learn.id, learn.completed)}
                  className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all-smooth hover:scale-110 cursor-pointer ${
                    learn.completed 
                      ? 'bg-green-500 border-green-500 hover:bg-green-600 hover:border-green-600' 
                      : 'bg-white border-slate-300 hover:border-green-400 dark:bg-slate-800 dark:border-slate-600 dark:hover:border-green-500'
                  }`}
                  style={{ minWidth: '20px', minHeight: '20px' }}
                >
                  {learn.completed && (
                    <i className="fas fa-check text-white text-xs"></i>
                  )}
                </div>
                
                {editingTask === learn.id ? (
                  <Input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyPress={handleEditKeyPress}
                    onBlur={saveEdit}
                    className="border-none bg-transparent focus:ring-1 focus:ring-blue-300 focus:border-blue-300 shadow-none p-0 text-slate-700"
                    autoFocus
                  />
                ) : (
                  <p 
                    className={`text-slate-700 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 transition-colors ${learn.completed ? 'line-through text-slate-500' : ''}`}
                    onClick={() => !learn.completed && startEditing(learn)}
                    title={!learn.completed ? "Click to edit" : ""}
                  >
                    {learn.text}
                  </p>
                )}
              </div>
              
              {editingTask === learn.id ? (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-500 hover:text-green-600 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem]"
                    onClick={saveEdit}
                    disabled={editTaskMutation.isPending}
                  >
                    <i className="fas fa-check text-xs"></i>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem]"
                    onClick={cancelEdit}
                  >
                    <i className="fas fa-times text-xs"></i>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!learn.completed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem] bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600"
                      onClick={() => startEditing(learn)}
                      title="Edit learning goal"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        <path d="m15 5 4 4"/>
                      </svg>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors p-1 min-h-[1.5rem] min-w-[1.5rem] bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600"
                    onClick={() => deleteTask(learn.id)}
                    title="Delete learning goal"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      <line x1="10" x2="10" y1="11" y2="17"/>
                      <line x1="14" x2="14" y1="11" y2="17"/>
                    </svg>
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Add New Learning Goal */}
          {canAddLearn && (
            <div className="flex items-center space-x-3 p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
              <div className="w-5 h-5 border-2 border-slate-300 rounded-full flex items-center justify-center">
                <i className="fas fa-plus text-slate-400 text-xs"></i>
              </div>
              <Input
                type="text"
                placeholder="Add a learning goal for today..."
                value={newLearnText}
                onChange={(e) => setNewLearnText(e.target.value)}
                onKeyPress={handleLearnKeyPress}
                className="flex-1 border-none bg-transparent focus:ring-0 focus:border-none shadow-none p-0"
                disabled={createTaskMutation.isPending}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
