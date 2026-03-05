import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useRegister } from '../../hooks/useAuth';
import type { AxiosError } from 'axios';
import type { ApiError } from '../../types/auth';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email address').max(256),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/[0-9]/, 'Must contain a digit')
      .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const register_ = useRegister();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = ({ confirmPassword: _c, ...data }: RegisterFormValues) => {
    register_.mutate(data);
  };

  const errorMessage = register_.error
    ? ((register_.error as AxiosError<ApiError>).response?.data?.detail
        ?? (register_.error as AxiosError<ApiError>).response?.data?.title
        ?? 'Registration failed. Please try again.')
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" placeholder="Jane" {...register('firstName')} aria-invalid={!!errors.firstName} />
          {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" placeholder="Doe" {...register('lastName')} aria-invalid={!!errors.lastName} />
          {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} aria-invalid={!!errors.email} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" {...register('password')} aria-invalid={!!errors.password} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" {...register('confirmPassword')} aria-invalid={!!errors.confirmPassword} />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || register_.isPending}>
        {register_.isPending ? 'Creating account…' : 'Create Account'}
      </Button>
    </form>
  );
}
