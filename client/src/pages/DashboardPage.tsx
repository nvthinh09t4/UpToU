import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function DashboardPage() {
  const { user } = useAuthStore();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            variant="outline"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? 'Signing out…' : 'Sign Out'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.firstName}!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}</p>
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Roles:</span> {user?.roles.join(', ')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
