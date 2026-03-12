import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Avatar, Box, Card, CardActionArea, CardContent, Chip,
  Divider, Grid, Skeleton, Stack, Tooltip, Typography,
} from '@mui/material'
import ArticleIcon from '@mui/icons-material/Article'
import AutoGraphIcon from '@mui/icons-material/AutoGraph'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import GroupsIcon from '@mui/icons-material/Groups'
import LoginIcon from '@mui/icons-material/Login'
import NewReleasesIcon from '@mui/icons-material/NewReleases'
import PeopleIcon from '@mui/icons-material/People'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ScheduleIcon from '@mui/icons-material/Schedule'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material'
import { adminService } from '@/services/adminService'
import { useAuthStore } from '@/store/authStore'
import type { DashboardStats, RecentUser, RecentStory } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return m + 'm ago'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h ago'
  return Math.floor(h / 24) + 'd ago'
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, sub, highlight }: {
  label: string; value: number; icon: React.ReactNode
  color: string; sub?: string; highlight?: boolean
}) {
  return (
    <Card elevation={0} sx={{
      border: '1px solid', borderColor: highlight ? color : 'divider',
      borderTopWidth: 3, borderTopColor: color, height: '100%',
      transition: 'box-shadow .15s', '&:hover': { boxShadow: 3 },
    }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}
              textTransform="uppercase" letterSpacing={0.6}>{label}</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, lineHeight: 1.1 }}>{fmt(value)}</Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{sub}</Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color + '18', color, width: 44, height: 44 }}>{icon}</Avatar>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ── Quick-nav Card ────────────────────────────────────────────────────────────

function QuickNav({ label, icon, color, to }: {
  label: string; icon: React.ReactNode; color: string; to: string
}) {
  const navigate = useNavigate()
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <CardActionArea onClick={() => navigate(to)} sx={{ p: 2 }}>
        <Stack alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: color + '18', color, width: 44, height: 44 }}>{icon}</Avatar>
          <Typography variant="caption" fontWeight={600}>{label}</Typography>
        </Stack>
      </CardActionArea>
    </Card>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <Box>
      <Skeleton width={280} height={36} sx={{ mb: 0.5 }} />
      <Skeleton width={200} height={20} sx={{ mb: 3 }} />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
            <Skeleton variant="rounded" height={100} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}><Skeleton variant="rounded" height={280} /></Grid>
        <Grid size={{ xs: 12, md: 6 }}><Skeleton variant="rounded" height={280} /></Grid>
      </Grid>
    </Box>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

const QUICK_NAV = [
  { label: 'Users',   icon: <PeopleIcon />,       color: '#3b82f6', to: '/users'   },
  { label: 'Roles',   icon: <GroupsIcon />,        color: '#8b5cf6', to: '/roles'  },
  { label: 'Stories', icon: <ArticleIcon />,       color: '#0ea5e9', to: '/stories'},
  { label: 'Reports', icon: <AutoGraphIcon />,     color: '#22c55e', to: '/reports'},
  { label: 'Rewards', icon: <ShoppingCartIcon />,  color: '#f97316', to: '/rewards'},
  { label: 'Jobs',    icon: <ScheduleIcon />,      color: '#ec4899', to: '/jobs'   },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: s, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => adminService.getDashboard().then((r) => r.data),
    refetchInterval: 30_000,
  })

  if (isLoading || !s) return <PageSkeleton />

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Box>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>{greeting()}, {user?.firstName}!</Typography>
          <Typography variant="body2" color="text.secondary">{today}</Typography>
        </Box>
        <Chip
          label="Live · 30s" size="small" color="success" variant="outlined"
          icon={<TrendingUpIcon sx={{ fontSize: '14px !important' }} />}
        />
      </Stack>

      {/* ── KPIs: Users ───────────────────────────────────────────────────── */}
      <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
        Users
      </Typography>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard label="Total Users" value={s.totalUsers} icon={<PeopleIcon />} color="#3b82f6" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard label="Active" value={s.activeUsers} icon={<CheckCircleIcon />} color="#22c55e" sub="Not suspended" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard label="Registered Today" value={s.registeredToday} icon={<PersonAddIcon />}
            color="#f97316" sub="New sign-ups (UTC)" highlight={s.registeredToday > 0} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard label="Logged In Today" value={s.loggedInToday} icon={<LoginIcon />}
            color="#a855f7" sub="Unique logins (UTC)" />
        </Grid>
      </Grid>

      {/* ── KPIs: Content ─────────────────────────────────────────────────── */}
      <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
        Content
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard label="Published Stories" value={s.publishedStories} icon={<ArticleIcon />}
            color="#0ea5e9" sub={s.totalStories + ' total incl. drafts'} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard label="New This Week" value={s.storiesThisWeek} icon={<NewReleasesIcon />}
            color="#f43f5e" highlight={s.storiesThisWeek > 0} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard label="Comments" value={Number(s.totalComments)} icon={<ChatBubbleIcon />} color="#eab308" />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 3 }}>
          <KpiCard label="Reactions" value={Number(s.totalReactions)} icon={<EmojiEmotionsIcon />} color="#ec4899" />
        </Grid>
      </Grid>

      {/* ── Recent Activity ───────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Recent Signups */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>Recent Signups</Typography>
              <Chip
                label={'+' + s.registeredToday + ' today'} size="small"
                color={s.registeredToday > 0 ? 'success' : 'default'} variant="outlined"
              />
            </Stack>
            <Divider />
            {s.recentUsers.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No users yet.</Typography>
              </Box>
            ) : s.recentUsers.map((u: RecentUser, i) => (
              <Box key={u.id}>
                <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 2.5, py: 1.5 }}>
                  <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: 'primary.main' }}>
                    {u.firstName[0]}{u.lastName[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>{u.firstName} {u.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{u.email}</Typography>
                  </Box>
                  <Stack alignItems="flex-end" gap={0.5}>
                    <Tooltip title={new Date(u.createdAt).toLocaleString()}>
                      <Typography variant="caption" color="text.secondary">{timeAgo(u.createdAt)}</Typography>
                    </Tooltip>
                    {!u.isActive && (
                      <Chip label="suspended" size="small" color="error" variant="outlined"
                        sx={{ height: 18, fontSize: 10 }} />
                    )}
                  </Stack>
                </Stack>
                {i < s.recentUsers.length - 1 && <Divider sx={{ mx: 2.5 }} />}
              </Box>
            ))}
          </Card>
        </Grid>

        {/* Recent Stories */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>Recent Stories</Typography>
              <Chip
                label={s.storiesThisWeek + ' this week'} size="small"
                color={s.storiesThisWeek > 0 ? 'primary' : 'default'} variant="outlined"
              />
            </Stack>
            <Divider />
            {s.recentStories.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No stories yet.</Typography>
              </Box>
            ) : s.recentStories.map((story: RecentStory, i) => (
              <Box key={story.id}>
                <Stack direction="row" alignItems="center" gap={1.5} sx={{ px: 2.5, py: 1.5 }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: 'info.main' }}>
                    <ArticleIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>{story.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {story.categoryTitle} · {fmt(story.viewCount)} views
                    </Typography>
                  </Box>
                  {story.publishDate && (
                    <Tooltip title={new Date(story.publishDate).toLocaleString()}>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {timeAgo(story.publishDate)}
                      </Typography>
                    </Tooltip>
                  )}
                </Stack>
                {i < s.recentStories.length - 1 && <Divider sx={{ mx: 2.5 }} />}
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>

      {/* ── Quick Access ──────────────────────────────────────────────────── */}
      <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
        Quick Access
      </Typography>
      <Grid container spacing={1.5}>
        {QUICK_NAV.map(({ label, icon, color, to }) => (
          <Grid key={to} size={{ xs: 4, sm: 2 }}>
            <QuickNav label={label} icon={icon} color={color} to={to} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
