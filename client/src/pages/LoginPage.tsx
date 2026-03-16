import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/layout/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons';
import { Alert, AlertDescription } from '../components/ui/alert';

export function LoginPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const registered = searchParams.get('registered') === 'true';

  return (
    <AuthLayout title={t('auth.login.title')} subtitle="Welcome back — your stories are waiting.">
      <div className="space-y-6">
        {registered && (
          <Alert>
            <AlertDescription>{t('auth.login.confirmed')}</AlertDescription>
          </Alert>
        )}
        <LoginForm />
        <SocialLoginButtons />
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-medium underline underline-offset-4 hover:text-primary">
            {t('auth.login.createOne')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
