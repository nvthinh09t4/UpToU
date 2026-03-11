import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RefreshIcon from '@mui/icons-material/Refresh'
import { jobService } from '@/services/jobService'
import type { JobStats, RecurringJobInfo } from '@/types'

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Paper sx={{ px: 3, py: 2, flex: 1, minWidth: 120 }}>
      <Typography variant="h4" fontWeight={700} sx={{ color }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Paper>
  )
}

function StatsRow({ stats }: { stats: JobStats }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
      <StatCard label="Enqueued"   value={stats.enqueued}   color="text.primary" />
      <StatCard label="Processing" value={stats.processing} color="#1976d2" />
      <StatCard label="Scheduled"  value={stats.scheduled}  color="#7b1fa2" />
      <StatCard label="Succeeded"  value={stats.succeeded}  color="#2e7d32" />
      <StatCard label="Failed"     value={stats.failed}     color="#c62828" />
      <StatCard label="Recurring"  value={stats.recurring}  color="#e65100" />
    </Box>
  )
}

// ── Recurring jobs table ──────────────────────────────────────────────────────

function StateChip({ state }: { state: string | null }) {
  if (!state) return <Chip label="Never run" size="small" variant="outlined" />
  if (state === 'Succeeded') return <Chip icon={<CheckCircleIcon />} label="Succeeded" size="small" color="success" />
  if (state === 'Failed')    return <Chip icon={<ErrorIcon />}        label="Failed"    size="small" color="error"   />
  return <Chip label={state} size="small" />
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

interface RecurringTableProps {
  jobs: RecurringJobInfo[]
  onTrigger: (id: string) => void
  triggeringId: string | null
}

function RecurringTable({ jobs, onTrigger, triggeringId }: RecurringTableProps) {
  return (
    <TableContainer component={Paper} sx={{ mb: 4 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700 } }}>
            <TableCell>Job Name</TableCell>
            <TableCell>Schedule (Cron)</TableCell>
            <TableCell>Last Run</TableCell>
            <TableCell>Next Run</TableCell>
            <TableCell>Last Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>{job.displayName}</Typography>
                <Typography variant="caption" color="text.secondary">{job.id}</Typography>
              </TableCell>
              <TableCell>
                <code style={{ fontSize: 12 }}>{job.cron}</code>
              </TableCell>
              <TableCell>{fmtDate(job.lastExecution)}</TableCell>
              <TableCell>{fmtDate(job.nextExecution)}</TableCell>
              <TableCell><StateChip state={job.lastJobState} /></TableCell>
              <TableCell align="right">
                <Tooltip title="Run Now">
                  <span>
                    <IconButton
                      size="small"
                      color="primary"
                      disabled={triggeringId === job.id}
                      onClick={() => onTrigger(job.id)}
                    >
                      {triggeringId === job.id
                        ? <CircularProgress size={16} />
                        : <PlayArrowIcon fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ── History table ─────────────────────────────────────────────────────────────

function HistorySection() {
  const [expanded, setExpanded] = useState(true)

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['jobs-history'],
    queryFn: () => jobService.getHistory(40).then((r) => r.data),
    refetchInterval: 15_000,
  })

  return (
    <Paper sx={{ mb: 2 }}>
      <Box
        sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <Typography variant="subtitle1" fontWeight={700}>Recent Executions</Typography>
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>

      <Collapse in={expanded}>
        {isLoading ? (
          <Box sx={{ px: 2, pb: 2 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={48} />)}
          </Box>
        ) : history.length === 0 ? (
          <Typography color="text.secondary" sx={{ px: 2, pb: 2 }}>No execution history yet.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700 } }}>
                  <TableCell>Method</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Executed At</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <code style={{ fontSize: 12 }}>{item.jobName}</code>
                    </TableCell>
                    <TableCell>
                      {item.state === 'Succeeded'
                        ? <Chip icon={<CheckCircleIcon />} label="Succeeded" size="small" color="success" />
                        : <Chip icon={<ErrorIcon />}        label="Failed"    size="small" color="error"   />}
                    </TableCell>
                    <TableCell>{fmtDate(item.executedAt)}</TableCell>
                    <TableCell>{item.duration ?? '—'}</TableCell>
                    <TableCell>
                      {item.exceptionMessage
                        ? <Tooltip title={item.exceptionMessage}><Typography variant="caption" color="error" sx={{ cursor: 'help' }}>Hover to view</Typography></Tooltip>
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Collapse>
    </Paper>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const qc = useQueryClient()
  const [triggeringId, setTriggeringId] = useState<string | null>(null)
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null)
  const [triggerError, setTriggerError] = useState<string | null>(null)

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs-recurring'],
    queryFn: () => jobService.getRecurringJobs().then((r) => r.data),
    refetchInterval: 30_000,
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['jobs-stats'],
    queryFn: () => jobService.getStats().then((r) => r.data),
    refetchInterval: 10_000,
  })

  const { mutate: trigger } = useMutation({
    mutationFn: (jobId: string) => {
      setTriggeringId(jobId)
      return jobService.triggerJob(jobId)
    },
    onSuccess: (res) => {
      setTriggerSuccess(`Job enqueued — Hangfire ID: ${res.data.jobId}`)
      setTriggerError(null)
      qc.invalidateQueries({ queryKey: ['jobs-history'] })
    },
    onError: () => {
      setTriggerError('Failed to trigger job. Please try again.')
      setTriggerSuccess(null)
    },
    onSettled: () => setTriggeringId(null),
  })

  function handleRefresh() {
    qc.invalidateQueries({ queryKey: ['jobs-recurring'] })
    qc.invalidateQueries({ queryKey: ['jobs-stats'] })
    qc.invalidateQueries({ queryKey: ['jobs-history'] })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Background Jobs</Typography>
        <Tooltip title="Refresh all">
          <IconButton onClick={handleRefresh}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      {triggerSuccess && (
        <Alert severity="success" onClose={() => setTriggerSuccess(null)} sx={{ mb: 2 }}>
          {triggerSuccess}
        </Alert>
      )}
      {triggerError && (
        <Alert severity="error" onClose={() => setTriggerError(null)} sx={{ mb: 2 }}>
          {triggerError}
        </Alert>
      )}

      {/* Stats */}
      {statsLoading
        ? <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>{[...Array(6)].map((_, i) => <Skeleton key={i} variant="rectangular" height={72} sx={{ flex: 1 }} />)}</Box>
        : stats && <StatsRow stats={stats} />}

      {/* Recurring Jobs */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Recurring Jobs</Typography>

      {jobsLoading ? (
        <Skeleton variant="rectangular" height={120} sx={{ mb: 4 }} />
      ) : (
        <RecurringTable
          jobs={jobs}
          onTrigger={trigger}
          triggeringId={triggeringId}
        />
      )}

      {/* History */}
      <HistorySection />
    </Box>
  )
}
