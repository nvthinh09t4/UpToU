import { useQuery } from '@tanstack/react-query';
import { authApi } from '../services/authApi';
import { useAuthStore } from '../store/authStore';

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApi.me().then((res) => res.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
