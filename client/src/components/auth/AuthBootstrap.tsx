import { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import type { AuthResponse } from '../../types/auth';

interface AuthBootstrapProps {
  children: React.ReactNode;
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const [ready, setReady] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    // Use _skipRetry so a 401 here (no session) doesn't trigger the interceptor
    // to attempt another refresh — this is an expected "not logged in" response.
    apiClient
      .post<AuthResponse>('/auth/refresh', null, { _skipRetry: true } as object)
      .then(({ data }) => setAuth(data.accessToken, data.user))
      .catch(() => {
        // No active session in this browser — user is not logged in.
      })
      .finally(() => setReady(true));
  }, [setAuth]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
