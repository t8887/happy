import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { scheduleTaskReminder, cancelTaskReminder } from '../services/notifications';
import { enqueueMutation } from '../storage/syncQueue';

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
    mutationFn: async ({ title, type, repeatType, scheduledTime, image }) => {
      const { data } = await api.post('/tasks', { title, type, repeatType, scheduledTime, image });
      return data.task;
    },

    // Optimistically insert a placeholder task so the list updates instantly
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      const optimisticTask = {
        _id:         `temp_${Date.now()}`,
        title:       vars.title,
        type:        vars.type,
        repeatType:  vars.repeatType,
        scheduledTime: vars.scheduledTime ?? null,
        isCompleted: false,
        createdAt:   new Date().toISOString(),
        _optimistic: true,
      };
      queryClient.setQueryData(['tasks'], (old = []) => [optimisticTask, ...old]);
      return { previousTasks };
    },

    onError: (_err, vars, context) => {
      // Roll back optimistic insert
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      // Save for later replay when back online
      enqueueMutation('createTask', vars);
    },

    onSuccess: (task) => {
      if (task?.scheduledTime) scheduleTaskReminder(task);
    },

    onSettled: () => {
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
    onError: (_err, taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      // Queue for retry when back online
      enqueueMutation('completeTask', { taskId });
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

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, updates }) => {
      const { data } = await api.patch(`/tasks/${taskId}`, updates);
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId) => {
      await api.delete(`/tasks/${taskId}`);
    },

    // Optimistically remove the task from the list immediately
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      await queryClient.cancelQueries({ queryKey: ['completedTasks'] });
      const previousTasks          = queryClient.getQueryData(['tasks']);
      const previousCompletedTasks = queryClient.getQueryData(['completedTasks']);

      queryClient.setQueryData(['tasks'],          (old = []) => old.filter(t => t._id !== taskId));
      queryClient.setQueryData(['completedTasks'], (old = []) => old.filter(t => t._id !== taskId));

      return { previousTasks, previousCompletedTasks };
    },

    onError: (_err, taskId, context) => {
      if (context?.previousTasks)          queryClient.setQueryData(['tasks'],          context.previousTasks);
      if (context?.previousCompletedTasks) queryClient.setQueryData(['completedTasks'], context.previousCompletedTasks);
      enqueueMutation('deleteTask', { taskId });
    },

    onSuccess: (_data, taskId) => {
      cancelTaskReminder(taskId);
    },

    onSettled: () => {
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
