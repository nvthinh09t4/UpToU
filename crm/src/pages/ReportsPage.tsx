import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Avatar, Box, Card, CardContent, CardHeader, Chip,
  Divider, Grid, LinearProgress, Skeleton, Stack,
  Tab, Table, TableBody, TableCell, TableHead, TableRow,
  Tabs, Tooltip, Typography,
} from '@mui/material'
import ArticleIcon from '@mui/icons-material/Article'
import AutoGraphIcon from '@mui/icons-material/AutoGraph'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import CategoryIcon from '@mui/icons-material/Category'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import PeopleIcon from '@mui/icons-material/People'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { adminService } from '@/services/adminService'
import type { StoryStats, UserActivity } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function relativeBar(value: number, max: number) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'action.hover' }}
      />
      <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'right', color: 'text.secondary' }}>
        {fmt(value)}
      </Typography>
    </Box>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing={0.5}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5, lineHeight: 1.2 }}>
              {typeof value === 'number' ? fmt(value) : value}
            </Typography>
            {sub && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {sub}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.lighter`, color: `${color}.main`, width: 44, height: 44 }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
            <Skeleton variant="rounded" height={100} />
          </Grid>
        ))}
      </Grid>
      <Skeleton variant="rounded" height={400} />
    </Box>
  )
}

// ── Story sort types ──────────────────────────────────────────────────────────

type StorySortKey = 'viewCount' | 'commentCount' | 'reactionCount' | 'upvoteCount' | 'bookmarkCount'

const STORY_SORT_OPTIONS: { key: StorySortKey; label: string }[] = [
  { key: 'viewCount', label: 'Views' },
  { key: 'commentCount', label: 'Comments' },
  { key: 'reactionCount', label: 'Reactions' },
  { key: 'upvoteCount', label: 'Upvotes' },
  { key: 'bookmarkCount', label: 'Bookmarks' },
]

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [storySort, setStorySort] = useState<StorySortKey>('viewCount')
  const [activeTab, setActiveTab] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminService.getReports().then((r) => r.data),
    staleTime: 2 * 60_000,
  })

  if (isLoading) return <PageSkeleton />
  if (!data) return null

  const { overview, topStories, trendingStories, mostActiveUsers, categoryStats, reactionDistribution } = data

  const sortedStories = [...topStories].sort((a, b) => b[storySort] - a[storySort])
  const maxViews = Math.max(...categoryStats.map((c) => c.totalViews), 1)
  const maxComments = Math.max(...categoryStats.map((c) => c.totalComments), 1)
  const maxActivity = Math.max(...mostActiveUsers.map((u) => u.totalActivity), 1)
  const totalReactions = reactionDistribution.likeCount + reactionDistribution.loveCount + reactionDistribution.laughCount

  return (
    <Box>
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 3 }}>
        <AutoGraphIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Analytics & Reports</Typography>
      </Stack>

      {/* ── Overview stat cards ─────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard label="Total Users" value={overview.totalUsers}
            sub={`+${overview.newUsersThisWeek} this week · +${overview.newUsersThisMonth} this month`}
            icon={<PeopleIcon fontSize="small" />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard label="Published Stories" value={overview.publishedStories}
            sub={`${overview.totalStories} total incl. drafts`}
            icon={<ArticleIcon fontSize="small" />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard label="Total Views" value={overview.totalViews}
            icon={<VisibilityIcon fontSize="small" />} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard label="Comments" value={overview.totalComments}
            icon={<ChatBubbleIcon fontSize="small" />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard label="Reactions" value={overview.totalReactions}
            sub={`${overview.totalVotes} votes · ${overview.totalBookmarks} saves`}
            icon={<EmojiEmotionsIcon fontSize="small" />} color="error" />
        </Grid>
      </Grid>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Top Stories" />
        <Tab icon={<LocalFireDepartmentIcon />} iconPosition="start" label="Trending" />
        <Tab icon={<PeopleIcon />} iconPosition="start" label="Active Users" />
        <Tab icon={<CategoryIcon />} iconPosition="start" label="Categories" />
        <Tab icon={<EmojiEmotionsIcon />} iconPosition="start" label="Reactions" />
      </Tabs>

      {/* ── Tab 0: Top Stories ────────────────────────────────────────── */}
      {activeTab === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardHeader
            title="Top Stories"
            subheader="Ranked by selected metric"
            action={
              <Stack direction="row" gap={0.5} flexWrap="wrap" justifyContent="flex-end">
                {STORY_SORT_OPTIONS.map((o) => (
                  <Chip
                    key={o.key}
                    label={o.label}
                    size="small"
                    variant={storySort === o.key ? 'filled' : 'outlined'}
                    color={storySort === o.key ? 'primary' : 'default'}
                    onClick={() => setStorySort(o.key)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            }
          />
          <Divider />
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Story</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right"><Tooltip title="Views"><VisibilityIcon sx={{ fontSize: 16 }} /></Tooltip></TableCell>
                  <TableCell align="right"><Tooltip title="Comments"><ChatBubbleIcon sx={{ fontSize: 16 }} /></Tooltip></TableCell>
                  <TableCell align="right"><Tooltip title="Reactions"><EmojiEmotionsIcon sx={{ fontSize: 16 }} /></Tooltip></TableCell>
                  <TableCell align="right"><Tooltip title="Upvotes"><ThumbUpIcon sx={{ fontSize: 16, color: 'success.main' }} /></Tooltip></TableCell>
                  <TableCell align="right"><Tooltip title="Downvotes"><ThumbDownIcon sx={{ fontSize: 16, color: 'error.main' }} /></Tooltip></TableCell>
                  <TableCell align="right"><Tooltip title="Bookmarks"><BookmarkIcon sx={{ fontSize: 16 }} /></Tooltip></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedStories.map((s: StoryStats, i) => (
                  <TableRow key={s.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{i + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1}>
                        {s.coverImageUrl && (
                          <Box component="img" src={s.coverImageUrl} alt="" sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 280 }}>{s.title}</Typography>
                          {s.authorName && <Typography variant="caption" color="text.secondary">{s.authorName}</Typography>}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell><Chip label={s.categoryTitle} size="small" /></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={storySort === 'viewCount' ? 700 : 400}>{fmt(s.viewCount)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={storySort === 'commentCount' ? 700 : 400}>{fmt(s.commentCount)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={storySort === 'reactionCount' ? 700 : 400}>{fmt(s.reactionCount)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" color="success.main" fontWeight={storySort === 'upvoteCount' ? 700 : 400}>{fmt(s.upvoteCount)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" color="error.main">{fmt(s.downvoteCount)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" fontWeight={storySort === 'bookmarkCount' ? 700 : 400}>{fmt(s.bookmarkCount)}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      {/* ── Tab 1: Trending ───────────────────────────────────────────── */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Stories with the highest engagement activity in the last 7 days.
            Score = comments × 5 + reactions × 3 + votes × 2 + bookmarks × 4.
          </Typography>
          {trendingStories.length === 0 ? (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 4, textAlign: 'center' }}>
              <LocalFireDepartmentIcon sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
              <Typography color="text.secondary">No recent activity in the last 7 days.</Typography>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {trendingStories.map((t, i) => (
                <Grid item xs={12} sm={6} md={4} key={t.id}>
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
                    {t.coverImageUrl && (
                      <Box
                        component="img"
                        src={t.coverImageUrl}
                        alt={t.title}
                        sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '8px 8px 0 0' }}
                      />
                    )}
                    <CardContent>
                      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: i < 3 ? 'warning.main' : 'action.disabledBackground', color: i < 3 ? 'white' : 'text.secondary' }}>
                          {i + 1}
                        </Avatar>
                        <Chip label={t.categoryTitle} size="small" />
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocalFireDepartmentIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                          <Typography variant="caption" fontWeight={700} color="warning.main">{t.trendScore}</Typography>
                        </Box>
                      </Stack>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, lineHeight: 1.3 }}>
                        {t.title}
                      </Typography>
                      <Grid container spacing={1}>
                        {[
                          { icon: <ChatBubbleIcon sx={{ fontSize: 12 }} />, label: 'comments', val: t.recentComments },
                          { icon: <EmojiEmotionsIcon sx={{ fontSize: 12 }} />, label: 'reactions', val: t.recentReactions },
                          { icon: <ThumbUpIcon sx={{ fontSize: 12 }} />, label: 'votes', val: t.recentVotes },
                          { icon: <BookmarkIcon sx={{ fontSize: 12 }} />, label: 'saves', val: t.recentBookmarks },
                        ].map(({ icon, label, val }) => (
                          <Grid item xs={6} key={label}>
                            <Stack direction="row" alignItems="center" gap={0.5}>
                              <Box sx={{ color: 'text.secondary' }}>{icon}</Box>
                              <Typography variant="caption" color="text.secondary">{val} {label}</Typography>
                            </Stack>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* ── Tab 2: Active Users ──────────────────────────────────────── */}
      {activeTab === 2 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardHeader title="Most Active Users" subheader="Ranked by total engagement activity (comments + reactions + votes + bookmarks)" />
          <Divider />
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Activity Score</TableCell>
                  <TableCell align="right">Comments</TableCell>
                  <TableCell align="right">Reactions</TableCell>
                  <TableCell align="right">Votes</TableCell>
                  <TableCell align="right">Bookmarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mostActiveUsers.map((u: UserActivity, i) => (
                  <TableRow key={u.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>{i + 1}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1.5}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{u.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {u.mentionHandle ? `@${u.mentionHandle}` : u.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      {relativeBar(u.totalActivity, maxActivity)}
                    </TableCell>
                    <TableCell align="right">{fmt(u.commentCount)}</TableCell>
                    <TableCell align="right">{fmt(u.reactionCount)}</TableCell>
                    <TableCell align="right">{fmt(u.voteCount)}</TableCell>
                    <TableCell align="right">{fmt(u.bookmarkCount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      {/* ── Tab 3: Categories ────────────────────────────────────────── */}
      {activeTab === 3 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardHeader title="Category Engagement" subheader="Which topics users engage with most" />
          <Divider />
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Stories</TableCell>
                  <TableCell>Total Views</TableCell>
                  <TableCell>Comments</TableCell>
                  <TableCell>Reactions</TableCell>
                  <TableCell align="right">Bookmarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categoryStats.map((c) => (
                  <TableRow key={c.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <CategoryIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight={500}>{c.title}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{c.storyCount}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{relativeBar(c.totalViews, maxViews)}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{relativeBar(c.totalComments, maxComments)}</TableCell>
                    <TableCell align="right">{fmt(c.totalReactions)}</TableCell>
                    <TableCell align="right">{fmt(c.totalBookmarks)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      {/* ── Tab 4: Reactions ─────────────────────────────────────────── */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardHeader title="Reaction Breakdown" subheader={`${fmt(totalReactions)} total reactions`} />
              <Divider />
              <CardContent>
                {totalReactions === 0 ? (
                  <Typography color="text.secondary" textAlign="center" py={3}>No reactions yet.</Typography>
                ) : (
                  <Stack gap={2.5} sx={{ mt: 1 }}>
                    {[
                      { emoji: '👍', label: 'Like', count: reactionDistribution.likeCount, color: '#1976d2' },
                      { emoji: '❤️', label: 'Love', count: reactionDistribution.loveCount, color: '#e91e63' },
                      { emoji: '😂', label: 'Laugh', count: reactionDistribution.laughCount, color: '#ff9800' },
                    ].map(({ emoji, label, count, color }) => {
                      const pct = totalReactions > 0 ? Math.round((count / totalReactions) * 100) : 0
                      return (
                        <Box key={label}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Stack direction="row" alignItems="center" gap={1}>
                              <Typography fontSize={20}>{emoji}</Typography>
                              <Typography variant="body2" fontWeight={500}>{label}</Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" gap={1}>
                              <Typography variant="body2" color="text.secondary">{pct}%</Typography>
                              <Typography variant="body2" fontWeight={700}>{fmt(count)}</Typography>
                            </Stack>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 } }}
                          />
                        </Box>
                      )
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardHeader title="Engagement Summary" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  {[
                    { label: 'Story Votes', value: overview.totalVotes, icon: <ThumbUpIcon />, color: 'success.main' },
                    { label: 'Reactions', value: overview.totalReactions, icon: <EmojiEmotionsIcon />, color: 'error.main' },
                    { label: 'Comments', value: overview.totalComments, icon: <ChatBubbleIcon />, color: 'warning.main' },
                    { label: 'Bookmarks', value: overview.totalBookmarks, icon: <BookmarkIcon />, color: 'primary.main' },
                  ].map(({ label, value, icon, color }) => (
                    <Grid item xs={6} key={label}>
                      <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover', textAlign: 'center' }}>
                        <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
                        <Typography variant="h5" fontWeight={700}>{fmt(value)}</Typography>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
