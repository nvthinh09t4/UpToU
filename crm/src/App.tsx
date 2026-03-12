import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress } from '@mui/material'
import AppLayout from '@/components/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import CategoriesPage from '@/pages/CategoriesPage'
import RolesPage from '@/pages/RolesPage'
import UsersPage from '@/pages/UsersPage'
import StoriesPage from '@/pages/StoriesPage'
import ReportsPage from '@/pages/ReportsPage'
import JobsPage from '@/pages/JobsPage'
import RewardsAdminPage from '@/pages/RewardsAdminPage'
import InteractiveStoryEditorPage from '@/pages/InteractiveStoryEditorPage'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/services/apiClient'
import axios from 'axios'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    background: { default: '#f5f5f5' },
  },
  shape: { borderRadius: 8 },
  typography: { fontFamily: '"Roboto","Helvetica","Arial",sans-serif' },
})

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const setAuth     = useAuthStore((s) => s.setAuth)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const clearAuth   = useAuthStore((s) => s.clearAuth)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function bootstrap() {
      if (!accessToken) {
        // No stored token — try refreshing via cookie in case a session exists
        try {
          const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5070/api/v1'
          const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
          const newToken: string = refreshRes.data.accessToken
          setAccessToken(newToken)

          const meRes = await apiClient.get<{ id: string; email: string; firstName: string; lastName: string; roles: string[] }>(
            '/auth/me',
            { headers: { Authorization: `Bearer ${newToken}` } }
          )
          setAuth(newToken, meRes.data)
        } catch {
          // No valid session — proceed unauthenticated
          clearAuth()
        }
      } else {
        // Token exists (restored from sessionStorage) — re-validate it
        try {
          const meRes = await apiClient.get<{ id: string; email: string; firstName: string; lastName: string; roles: string[] }>(
            '/auth/me'
          )
          setAuth(accessToken, meRes.data)
        } catch {
          // Token is invalid/expired — try refresh via cookie
          try {
            const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5070/api/v1'
            const refreshRes = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
            const newToken: string = refreshRes.data.accessToken
            const meRes = await apiClient.get<{ id: string; email: string; firstName: string; lastName: string; roles: string[] }>(
              '/auth/me',
              { headers: { Authorization: `Bearer ${newToken}` } }
            )
            setAuth(newToken, meRes.data)
          } catch {
            clearAuth()
          }
        }
      }
      setReady(true)
    }

    bootstrap()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppBootstrap>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/roles" element={<RolesPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/stories" element={<StoriesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/rewards" element={<RewardsAdminPage />} />
                <Route path="/stories/:storyId/nodes" element={<InteractiveStoryEditorPage />} />
                <Route path="/jobs" element={<JobsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppBootstrap>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
