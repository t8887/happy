import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { scheduleTaskReminder, cancelTaskReminder } from '../services/notifications';

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data.tasks;
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, type, repeatType, scheduledTime }) => {
      const { data } = await api.post('/tasks', { title, type, repeatType, scheduledTime });
      return data.task;
    },
    onSuccess: (task) => {
      // Schedule reminder if task has a time set
      if (task?.scheduledTime) scheduleTaskReminder(task);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId) => {
      const { data } = await api.patch(`/tasks/${taskId}/complete`);
      return data;
    },

    // --- Optimistic update ---
    // Immediately mark the task as completed in the cache before the server responds.
    onMutate: async (taskId) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic change
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot current tasks list for rollback
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update: mark the task as completed
      queryClient.setQueryData(['tasks'], (old = []) =>
        old.map((task) =>
          task._id === taskId
            ? { ...task, isCompleted: true, completedAt: new Date().toISOString() }
            : task
        )
      );

      return { previousTasks }; // returned context for onError rollback
    },

    // If the server returns an error, roll back to the snapshot
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },

    // Always sync with server truth after mutation settles (success or error)
    onSettled: (_data, _err, taskId) => {
      // Cancel any scheduled reminder — task is now done
      cancelTaskReminder(taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: (_data, taskId) => {
      // Cancel any scheduled reminder for this task
      cancelTaskReminder(taskId);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completedTasks'] });
    },
  });
};

export const useCompletedTasks = () => {
  return useQuery({
    queryKey: ['completedTasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks/completed');
      return data.tasks;
    },
  });
};
