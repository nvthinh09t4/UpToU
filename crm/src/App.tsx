import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
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
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
