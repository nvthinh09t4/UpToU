import { useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import {
  AppBar, Avatar, Box, Chip, Divider, Drawer, IconButton,
  List, ListItemButton, ListItemIcon, ListItemText,
  Menu, MenuItem, Toolbar, Tooltip, Typography,
} from '@mui/material'
import ArticleIcon from '@mui/icons-material/Article'
import AutoGraphIcon from '@mui/icons-material/AutoGraph'
import CategoryIcon from '@mui/icons-material/Category'
import DashboardIcon from '@mui/icons-material/Dashboard'
import GroupsIcon from '@mui/icons-material/Groups'
import MenuIcon from '@mui/icons-material/Menu'
import PeopleIcon from '@mui/icons-material/People'
import LogoutIcon from '@mui/icons-material/Logout'
import ScheduleIcon from '@mui/icons-material/Schedule'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'

const DRAWER_WIDTH = 248

type NavItem = { label: string; path: string; icon: React.ReactNode; roles?: string[] }
type NavGroup = { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard', path: '/', icon: <DashboardIcon fontSize="small" />,
        roles: ['Admin', 'Senior Supervisor', 'Supervisor', 'Contributor'],
      },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Users', path: '/users', icon: <PeopleIcon fontSize="small" />, roles: ['Admin', 'Senior Supervisor'] },
      { label: 'Roles', path: '/roles', icon: <GroupsIcon fontSize="small" />, roles: ['Admin'] },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Categories', path: '/categories', icon: <CategoryIcon fontSize="small" />, roles: ['Admin', 'Senior Supervisor', 'Supervisor'] },
      { label: 'Stories',    path: '/stories',    icon: <ArticleIcon fontSize="small" />,  roles: ['Admin', 'Senior Supervisor', 'Supervisor', 'Contributor'] },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Reports', path: '/reports', icon: <AutoGraphIcon fontSize="small" />,    roles: ['Admin', 'Senior Supervisor'] },
      { label: 'Rewards', path: '/rewards', icon: <ShoppingCartIcon fontSize="small" />, roles: ['Admin'] },
      { label: 'Jobs',    path: '/jobs',    icon: <ScheduleIcon fontSize="small" />,     roles: ['Admin'] },
    ],
  },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard', '/users': 'Users', '/roles': 'Roles',
  '/categories': 'Categories', '/stories': 'Stories',
  '/reports': 'Reports', '/rewards': 'Rewards', '/jobs': 'Jobs',
}

const ROLE_BADGE_COLOR: Record<string, { bg: string; text: string }> = {
  'Admin':          { bg: 'rgba(239,68,68,0.2)',  text: '#fca5a5' },
  'Sr. Supervisor': { bg: 'rgba(245,158,11,0.2)', text: '#fcd34d' },
  'Supervisor':     { bg: 'rgba(99,102,241,0.25)',text: '#a5b4fc' },
  'Contributor':    { bg: 'rgba(16,185,129,0.2)', text: '#6ee7b7' },
}

const SB_BG        = '#0f172a'
const SB_TEXT      = 'rgba(255,255,255,0.65)'
const SB_ACTIVE_BG = 'rgba(99,102,241,0.18)'
const SB_ACTIVE    = '#a5b4fc'
const SB_HOVER     = 'rgba(255,255,255,0.06)'
const SB_DIVIDER   = 'rgba(255,255,255,0.08)'

export default function AppLayout() {
  const navigate      = useNavigate()
  const location      = useLocation()
  const user          = useAuthStore((s) => s.user)
  const clearAuth     = useAuthStore((s) => s.clearAuth)
  const primaryRole   = useAuthStore((s) => s.primaryRole)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl]     = useState<null | HTMLElement>(null)

  const userRoles = user?.roles ?? []
  const roleLabel = primaryRole()
  const roleColors = ROLE_BADGE_COLOR[roleLabel] ?? { bg: 'rgba(99,102,241,0.25)', text: '#a5b4fc' }

  const handleLogout = async () => {
    try { await authService.logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
  }

  const isVisible = (item: NavItem) =>
    !item.roles || item.roles.some((r) => userRoles.includes(r))

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: SB_BG }}>
      {/* Brand */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: 1.5, flexShrink: 0,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>U</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'white', lineHeight: 1.1 }}>UpToU</Typography>
          <Typography sx={{ color: SB_TEXT, fontSize: 11 }}>Staff Portal</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: SB_DIVIDER }} />

      {/* Nav groups */}
      <Box sx={{ flex: 1, overflowY: 'auto', pt: 1, pb: 2 }}>
        {NAV_GROUPS.map((group) => {
          const visible = group.items.filter(isVisible)
          if (visible.length === 0) return null
          return (
            <Box key={group.label}>
              <Typography sx={{
                px: 2.5, pt: 1.5, pb: 0.5, display: 'block',
                color: 'rgba(255,255,255,0.3)', fontWeight: 700,
                fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2,
              }}>
                {group.label}
              </Typography>
              <List disablePadding dense>
                {visible.map(({ label, path, icon }) => {
                  const active = location.pathname === path
                  return (
                    <ListItemButton
                      key={path}
                      selected={active}
                      onClick={() => { navigate(path); setMobileOpen(false) }}
                      sx={{
                        mx: 1.5, mb: 0.25, borderRadius: 1.5,
                        color: active ? SB_ACTIVE : SB_TEXT,
                        bgcolor: active ? SB_ACTIVE_BG : 'transparent',
                        '&:hover': { bgcolor: active ? SB_ACTIVE_BG : SB_HOVER, color: 'white' },
                        '&.Mui-selected, &.Mui-selected:hover': { bgcolor: SB_ACTIVE_BG },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{icon}</ListItemIcon>
                      <ListItemText
                        primary={label}
                        primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 600 : 400 }}
                      />
                      {active && <Box sx={{ width: 3, height: 16, borderRadius: 2, bgcolor: SB_ACTIVE }} />}
                    </ListItemButton>
                  )
                })}
              </List>
            </Box>
          )
        })}
      </Box>

      <Divider sx={{ borderColor: SB_DIVIDER }} />

      {/* User card at bottom */}
      <Box
        sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { bgcolor: SB_HOVER } }}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <Avatar sx={{ width: 34, height: 34, fontSize: 12, bgcolor: '#6366f1', flexShrink: 0 }}>
          {user?.firstName[0]}{user?.lastName[0]}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} sx={{ color: 'white' }} noWrap>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography sx={{ color: SB_TEXT, fontSize: 11 }} noWrap>{user?.email}</Typography>
        </Box>
        <Chip label={roleLabel} size="small" sx={{
          height: 18, fontSize: 10, flexShrink: 0,
          bgcolor: roleColors.bg, color: roleColors.text,
          '& .MuiChip-label': { px: 0.75 },
        }} />
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" elevation={0} sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        bgcolor: 'background.paper',
        borderBottom: '1px solid', borderColor: 'divider',
        color: 'text.primary',
      }}>
        <Toolbar sx={{ minHeight: '56px !important' }}>
          <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1.5, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700} sx={{ flexGrow: 1 }}>
            {PAGE_TITLES[location.pathname] ?? 'Panel'}
          </Typography>
          <Tooltip title={`${user?.firstName} ${user?.lastName}`}>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: '#6366f1' }}>
                {user?.firstName[0]}{user?.lastName[0]}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">{user?.firstName} {user?.lastName}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip label={roleLabel} size="small" sx={{ fontSize: 10, height: 18 }} />
          </Box>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>

      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0, display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' },
      }}>
        <Toolbar sx={{ minHeight: '56px !important' }} />
        {drawerContent}
      </Drawer>

      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: '56px', minHeight: '100vh', bgcolor: 'grey.50' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
