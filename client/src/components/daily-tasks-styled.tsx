import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks"],
  });

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed === b.completed) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return a.completed ? 1 : -1;
    });
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
        title: "Error adding task",
        description: error?.message || "Failed to add task. Please try again.",
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
    },
    onError: (error: any) => {
      toast({
        title: "Error updating task",
        description: error?.message || "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/daily-tasks/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting task",
        description: error?.message || "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() && tasks.length < 3) {
      createTaskMutation.mutate(newTaskText.trim());
    }
  };

  const handleToggleTask = (id: number, completed: boolean) => {
    updateTaskMutation.mutate({ id, completed: !completed });
  };

  const handleDeleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const completedCount = tasks.filter(task => task.completed).length;

  return (
    <div>
      {/* Task Counter */}
      <div style={{
        fontSize: '14px',
        color: '#666',
        marginBottom: '15px',
        textAlign: 'right'
      }}>
        {completedCount}/{tasks.length} tasks
      </div>

      <div style={{ marginBottom: '20px' }}>
        {/* Existing Tasks */}
        {sortedTasks.map((task) => (
          <div key={task.id} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <div
              onClick={() => handleToggleTask(task.id, task.completed)}
              style={{
                width: '20px',
                height: '20px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                marginRight: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: task.completed ? '#667eea' : 'transparent',
                borderColor: task.completed ? '#667eea' : '#ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px'
              }}
            >
              {task.completed && '✓'}
            </div>
            <span style={{
              flex: 1,
              fontSize: '16px',
              textDecoration: task.completed ? 'line-through' : 'none',
              opacity: task.completed ? 0.6 : 1
            }}>
              {task.text}
            </span>
            <button
              onClick={() => handleDeleteTask(task.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ccc',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
        ))}

        {/* Add New Task */}
        {tasks.length < 3 && (
          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #ddd',
                borderRadius: '6px',
                marginRight: '12px'
              }} />
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder={
                  tasks.length === 0 ? "Add your first priority for today..." :
                  tasks.length === 1 ? "What's your second goal?" :
                  "And your third focus area?"
                }
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  padding: '5px',
                  background: 'transparent'
                }}
                maxLength={100}
              />
            </div>
          </form>
        )}
      </div>

      {tasks.length >= 3 && (
        <div style={{
          fontSize: '14px',
          color: '#666',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          Focus on your 3 priorities today
        </div>
      )}
    </div>
  );
}