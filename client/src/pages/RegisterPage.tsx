import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { RegisterForm } from '../components/auth/RegisterForm';
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons';

export function RegisterPage() {
  return (
    <AuthLayout title="Create your UpToU account">
      <div className="space-y-6">
        <RegisterForm />
        <SocialLoginButtons />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
