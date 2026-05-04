import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

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
    mutationFn: async ({ title, type }) => {
      const { data } = await api.post('/tasks', { title, type });
      return data.task;
    },
    onSuccess: () => {
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
    onSettled: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};
