import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { authApi } from '../services/authApi';

type Status = 'pending' | 'success' | 'error';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('pending');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    if (!userId || !token) {
      setStatus('error');
      setErrorMessage('Invalid confirmation link. Please request a new one.');
      return;
    }

    authApi
      .confirmEmail(userId, token)
      .then(() => setStatus('success'))
      .catch(() => {
        setStatus('error');
        setErrorMessage('Confirmation failed. The link may have expired. Please request a new one.');
      });
  }, [searchParams]);

  return (
    <AuthLayout title="Email Confirmation">
      <div className="space-y-4">
        {status === 'pending' && (
          <p className="text-center text-muted-foreground">Confirming your email…</p>
        )}
        {status === 'success' && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>Your email has been confirmed! You can now sign in.</AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link to="/login">Go to Sign In</Link>
            </Button>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to Sign In</Link>
            </Button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
