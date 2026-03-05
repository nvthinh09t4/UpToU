import { useQuery } from '@tanstack/react-query'
import {
  Box, Card, CardContent, CircularProgress, Grid,
  Typography, Alert,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import LoginIcon from '@mui/icons-material/Login'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import GroupsIcon from '@mui/icons-material/Groups'
import { adminService } from '@/services/adminService'
import type { DashboardStats } from '@/types'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box className="flex items-start justify-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" fontWeight={700}>
              {value.toLocaleString()}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            sx={{ backgroundColor: `${color}20` }}
          >
            <Box sx={{ color }}>{icon}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => adminService.getDashboard().then((r) => r.data),
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">Failed to load dashboard stats.</Alert>
  }

  const stats = data!

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Live overview — refreshes every 30 seconds
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={<CheckCircleIcon />}
            color="#2e7d32"
            subtitle="Accounts not suspended"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Registered Today"
            value={stats.registeredToday}
            icon={<PersonAddIcon />}
            color="#ed6c02"
            subtitle="New sign-ups (UTC)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Logged In Today"
            value={stats.loggedInToday}
            icon={<LoginIcon />}
            color="#9c27b0"
            subtitle="Unique logins (UTC)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            title="Total Roles"
            value={stats.totalRoles}
            icon={<GroupsIcon />}
            color="#0288d1"
          />
        </Grid>
      </Grid>
    </Box>
  )
}
