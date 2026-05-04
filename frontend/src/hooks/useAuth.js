import api from '../services/api';
import useAuthStore from '../store/authStore';
import { useMutation } from '@tanstack/react-query';

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const { data } = await api.post('/auth/login', { email, password });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async ({ username, email, password }) => {
      const { data } = await api.post('/auth/register', { username, email, password });
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token);
    },
  });
};
