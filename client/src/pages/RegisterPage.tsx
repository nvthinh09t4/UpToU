import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/layout/AuthLayout';
import { RegisterForm } from '../components/auth/RegisterForm';
import { SocialLoginButtons } from '../components/auth/SocialLoginButtons';

export function RegisterPage() {
  const { t } = useTranslation();

  return (
    <AuthLayout title={t('auth.register.title')}>
      <div className="space-y-6">
        <RegisterForm />
        <SocialLoginButtons />
        <p className="text-center text-sm text-muted-foreground">
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="font-medium underline underline-offset-4 hover:text-primary">
            {t('auth.register.signIn')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
