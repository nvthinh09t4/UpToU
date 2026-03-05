import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, RegisterRequest } from '../types/auth';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: ({ data }) => {
      setAuth(data.accessToken, data.user);
      navigate('/dashboard');
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => navigate('/login?registered=true'),
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      navigate('/login');
    },
  });
}
