import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { useAuthStore } from '../store/authStore';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, clearAuth } = useAuthStore();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const accessToken = searchParams.get('accessToken');
    const error = searchParams.get('error');

    if (error || !accessToken) {
      navigate('/login?error=external_login_failed');
      return;
    }

    // Fetch user profile using the new access token
    authApi
      .me()
      .then(({ data }) => {
        setAuth(accessToken, data);
        // Clear the token from URL
        window.history.replaceState({}, '', '/auth/callback');
        navigate('/dashboard');
      })
      .catch(() => {
        clearAuth();
        navigate('/login?error=external_login_failed');
      });
  }, [searchParams, navigate, setAuth, clearAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Completing sign in…</p>
    </div>
  );
}
