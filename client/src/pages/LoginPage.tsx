import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons';
import { Alert, AlertDescription } from '../components/ui/alert';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const registered = searchParams.get('registered') === 'true';

  return (
    <AuthLayout title="Sign In to UpToU">
      <div className="space-y-6">
        {registered && (
          <Alert>
            <AlertDescription>
              Account created! Please check your email to confirm your address before signing in.
            </AlertDescription>
          </Alert>
        )}
        <LoginForm />
        <SocialLoginButtons />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium underline underline-offset-4 hover:text-primary">
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
