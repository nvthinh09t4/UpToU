import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
