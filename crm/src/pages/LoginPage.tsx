import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, CircularProgress,
  TextField, Typography, Alert,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await authService.login(email, password)
      const { accessToken, user } = res.data
      const CRM_ROLES = ['Admin', 'Senior Supervisor', 'Supervisor', 'Contributor']
      const hasCrmRole = CRM_ROLES.some((r) => user.roles.includes(r))
      if (!hasCrmRole) {
        setError('Access denied. You must be assigned a CRM role by an administrator before logging in here.')
        return
      }
      setAuth(accessToken, user)
      navigate('/')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ??
        'Login failed. Please check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box className="flex flex-col items-center mb-6">
            <Box className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-3">
              <LockOutlinedIcon sx={{ color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight={700}>UpToU CRM</Typography>
            <Typography variant="body2" color="text.secondary">Staff Portal</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
