import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  IconButton, InputAdornment, Stack, Switch, Tab, Tabs,
  TextField, Tooltip, Typography, Autocomplete,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import HistoryIcon from '@mui/icons-material/History'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import SendIcon from '@mui/icons-material/Send'
import { Star as StarIcon } from '@mui/icons-material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { adminService } from '@/services/adminService'
import { useAuthStore } from '@/store/authStore'
import type { Category, Story, StoryDetail, Tag } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type StoryFormData = {
  title: string; slug: string; description: string; excerpt: string
  coverImageUrl: string; authorName: string; isFeatured: boolean
  categoryId: number | ''; publishDate: string; isPublish: boolean; tagIds: number[]
  savePath: string; content: string; wordCount: number; scoreWeight: number
}

const EMPTY_FORM: StoryFormData = {
  title: '', slug: '', description: '', excerpt: '', coverImageUrl: '',
  authorName: '', isFeatured: false, categoryId: '', publishDate: '',
  isPublish: false, tagIds: [], savePath: '', content: '', wordCount: 0, scoreWeight: 1,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenCategories(cats: Category[]): Category[] {
  return cats.flatMap((c) => [c, ...flattenCategories(c.children)])
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

type StatusColor = 'default' | 'warning' | 'info' | 'success' | 'error'
const STATUS_META: Record<Story['status'], { color: StatusColor; label: string }> = {
  Draft:     { color: 'default',  label: 'Draft' },
  Submitted: { color: 'warning',  label: 'Under Review' },
  Approved:  { color: 'info',     label: 'Scheduled' },
  Published: { color: 'success',  label: 'Published' },
  Rejected:  { color: 'error',    label: 'Rejected' },
}

function StatusChip({ status }: { status: Story['status'] }) {
  const { color, label } = STATUS_META[status] ?? { color: 'default', label: status }
  return <Chip label={label} size="small" color={color} variant="outlined" />
}

// ── Approve dialog ────────────────────────────────────────────────────────────

function ApproveDialog({ story, onClose, onConfirm, saving }: {
  story: Story | null; onClose: () => void
  onConfirm: (publishDate: string | null) => void; saving: boolean
}) {
  const [publishDate, setPublishDate] = useState('')
  if (!story) return null
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Approve Story</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Approving <strong>{story.title}</strong>. Set a future publish date to schedule it, or leave blank to publish immediately.
        </Typography>
        <TextField
          label="Schedule Publish Date (optional)"
          type="datetime-local" value={publishDate}
          onChange={(e) => setPublishDate(e.target.value)}
          fullWidth InputLabelProps={{ shrink: true }}
          helperText="Leave blank to publish immediately."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained" color="success" startIcon={saving ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          disabled={saving} onClick={() => onConfirm(publishDate || null)}
        >
          {publishDate ? 'Schedule' : 'Publish Now'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Reject dialog ─────────────────────────────────────────────────────────────

function RejectDialog({ story, onClose, onConfirm, saving }: {
  story: Story | null; onClose: () => void
  onConfirm: (reason: string) => void; saving: boolean
}) {
  const [reason, setReason] = useState('')
  if (!story) return null
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reject Story</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Rejecting <strong>{story.title}</strong>. The author will be notified and can edit and re-submit.
        </Typography>
        <TextField label="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)}
          fullWidth multiline rows={3} placeholder="Explain why the story needs revision…" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained" color="error" startIcon={saving ? <CircularProgress size={16} /> : <CancelIcon />}
          disabled={saving || !reason.trim()} onClick={() => onConfirm(reason)}
        >
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Story dialog ──────────────────────────────────────────────────────────────

function StoryDialog({ open, story, categories, tags, onClose, onSave, saving }: {
  open: boolean; story: Story | null; categories: Category[]; tags: Tag[]
  onClose: () => void; onSave: (data: StoryFormData) => void; saving: boolean
}) {
  const allCats = flattenCategories(categories)
  const [tab, setTab] = useState(0)
  const locked = story?.status === 'Submitted'

  const [form, setForm] = useState<StoryFormData>(
    story ? {
      title: story.title, slug: story.slug ?? '', description: story.description ?? '',
      excerpt: story.excerpt ?? '', coverImageUrl: story.coverImageUrl ?? '',
      authorName: story.authorName ?? '', isFeatured: story.isFeatured,
      categoryId: story.categoryId,
      publishDate: story.publishDate ? story.publishDate.slice(0, 10) : '',
      isPublish: story.isPublish, tagIds: story.tags.map((t) => t.id),
      savePath: story.latestDetail?.savePath ?? '',
      content: story.latestDetail?.content ?? '',
      wordCount: story.latestDetail?.wordCount ?? 0,
      scoreWeight: story.latestDetail?.scoreWeight ?? 1,
    } : EMPTY_FORM
  )

  const set = <K extends keyof StoryFormData>(key: K, value: StoryFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <span>{story ? `Edit — ${story.title}` : 'New Story'}</span>
          {story && <StatusChip status={story.status} />}
        </Stack>
        {locked && (
          <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
            This story is under review and cannot be edited. Reject it first to allow changes.
          </Typography>
        )}
      </DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Metadata" />
        <Tab label="Content" disabled={!!story} />
      </Tabs>

      <DialogContent>
        {tab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {story?.rejectionReason && (
              <Alert severity="error" sx={{ mb: 0 }}>
                <strong>Rejection reason:</strong> {story.rejectionReason}
              </Alert>
            )}
            <Stack direction="row" gap={2}>
              <TextField label="Title *" value={form.title} onChange={(e) => set('title', e.target.value)}
                fullWidth disabled={locked} />
              <TextField label="Slug" value={form.slug} onChange={(e) => set('slug', e.target.value)}
                sx={{ flex: 1 }} placeholder="auto-generated" disabled={locked} />
            </Stack>
            <TextField label="Excerpt" value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)}
              fullWidth multiline rows={2} helperText="Short teaser shown on category cards" disabled={locked} />
            <TextField label="Description" value={form.description} onChange={(e) => set('description', e.target.value)}
              fullWidth multiline rows={2} helperText="Internal admin description" disabled={locked} />
            <TextField label="Cover Image URL" value={form.coverImageUrl}
              onChange={(e) => set('coverImageUrl', e.target.value)} fullWidth placeholder="https://…" disabled={locked} />
            <Stack direction="row" gap={2}>
              <TextField label="Author Name (display)" value={form.authorName}
                onChange={(e) => set('authorName', e.target.value)} sx={{ flex: 1 }} disabled={locked} />
              <TextField label="Publish Date" type="date" value={form.publishDate}
                onChange={(e) => set('publishDate', e.target.value)}
                InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} disabled={locked} />
            </Stack>
            <Autocomplete multiple options={tags} getOptionLabel={(t) => t.name}
              value={tags.filter((t) => form.tagIds.includes(t.id))}
              onChange={(_, v) => set('tagIds', v.map((t) => t.id))} disabled={locked}
              renderInput={(params) => <TextField {...params} label="Tags" />}
              renderTags={(value, getTagProps) =>
                value.map((tag, i) => <Chip label={tag.name} size="small" {...getTagProps({ index: i })} key={tag.id} />)
              }
            />
            <Autocomplete options={allCats} getOptionLabel={(c) => c.parentId ? `↳ ${c.title}` : c.title}
              value={allCats.find((c) => c.id === form.categoryId) ?? null}
              onChange={(_, v) => set('categoryId', v?.id ?? '')} disabled={locked}
              renderInput={(params) => <TextField {...params} label="Category *" />}
            />
            <Stack direction="row" gap={4}>
              <FormControlLabel control={<Switch checked={form.isPublish} onChange={(e) => set('isPublish', e.target.checked)} disabled={locked} />} label="Published" />
              <FormControlLabel control={<Switch checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} disabled={locked} />} label="Featured" />
            </Stack>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Stack direction="row" gap={2}>
              <TextField label="Save Path" value={form.savePath} onChange={(e) => set('savePath', e.target.value)}
                sx={{ flex: 1 }} placeholder="stories/category/filename.md" />
              <TextField label="Score Weight" type="number" value={form.scoreWeight}
                onChange={(e) => set('scoreWeight', parseFloat(e.target.value) || 1)}
                inputProps={{ step: 0.1, min: 0 }} sx={{ width: 140 }} />
            </Stack>
            <TextField label="Content (Markdown)" value={form.content}
              onChange={(e) => { set('content', e.target.value); set('wordCount', countWords(e.target.value)) }}
              fullWidth multiline rows={18}
              helperText={`${form.wordCount} words · ~${Math.max(1, Math.round(form.wordCount / 200))} min read`}
              inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" disabled={saving || locked || !form.title.trim() || !form.categoryId}
          onClick={() => onSave(form)}>
          {saving ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Revision dialog ───────────────────────────────────────────────────────────

function RevisionDialog({ open, story, details, detailsLoading, onClose, onAddRevision, saving }: {
  open: boolean; story: Story | null; details: StoryDetail[]; detailsLoading: boolean
  onClose: () => void
  onAddRevision: (data: { savePath: string; content: string | null; wordCount: number; changeNotes: string | null; scoreWeight: number; isPublish: boolean }) => void
  saving: boolean
}) {
  const [savePath, setSavePath] = useState('')
  const [content, setContent] = useState('')
  const [changeNotes, setChangeNotes] = useState('')
  const [scoreWeight, setScoreWeight] = useState(story?.latestDetail?.scoreWeight ?? 1)
  const [isPublish, setIsPublish] = useState(true)
  const wordCount = countWords(content)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Revisions — {story?.title}</DialogTitle>
      <DialogContent>
        {detailsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>History</Typography>
            {details.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No revisions yet.</Typography>
            ) : (
              <Stack gap={1} sx={{ mb: 3 }}>
                {details.map((d) => (
                  <Box key={d.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', p: 1.5 }}>
                    <Chip label={`rev ${d.revision}`} size="small" color={d.isPublish ? 'success' : 'default'} variant="outlined" />
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>{d.savePath}</Typography>
                    {d.changeNotes && <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>{d.changeNotes}</Typography>}
                    <Typography variant="caption" color="text.secondary">{d.wordCount}w</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(d.createdOn).toLocaleDateString()}</Typography>
                  </Box>
                ))}
              </Stack>
            )}

            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Add New Revision</Typography>
            <Stack gap={2}>
              <Stack direction="row" gap={2}>
                <TextField label="Save Path" value={savePath} onChange={(e) => setSavePath(e.target.value)} sx={{ flex: 1 }} placeholder="stories/category/filename-v2.md" />
                <TextField label="Score Weight" type="number" value={scoreWeight} onChange={(e) => setScoreWeight(parseFloat(e.target.value) || 1)} inputProps={{ step: 0.1, min: 0 }} sx={{ width: 140 }} />
              </Stack>
              <TextField label="Content (Markdown)" value={content} onChange={(e) => setContent(e.target.value)}
                fullWidth multiline rows={10}
                helperText={`${wordCount} words · ~${Math.max(1, Math.round(wordCount / 200))} min read`}
                inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }} />
              <TextField label="Change Notes" value={changeNotes} onChange={(e) => setChangeNotes(e.target.value)} fullWidth placeholder="What changed in this revision?" />
              <FormControlLabel control={<Switch checked={isPublish} onChange={(e) => setIsPublish(e.target.checked)} />} label="Publish this revision immediately" />
            </Stack>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<AddCircleIcon />} disabled={saving || !savePath.trim()}
          onClick={() => onAddRevision({ savePath, content: content || null, wordCount, changeNotes: changeNotes || null, scoreWeight, isPublish })}>
          {saving ? <CircularProgress size={20} /> : 'Add Revision'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StoriesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const isStaff = useAuthStore((s) => s.isStaff)()

  const [pageTab, setPageTab] = useState(0)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Story | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null)
  const [revisionStory, setRevisionStory] = useState<Story | null>(null)
  const [approveTarget, setApproveTarget] = useState<Story | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Story | null>(null)

  const { data: stories = [], isLoading, error } = useQuery({
    queryKey: ['admin-stories'],
    queryFn: () => adminService.getStories().then((r) => r.data),
  })

  const { data: submitted = [], isLoading: submittedLoading } = useQuery({
    queryKey: ['submitted-stories'],
    queryFn: () => adminService.getSubmittedStories().then((r) => r.data),
    enabled: isStaff,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminService.getCategories().then((r) => r.data),
  })

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => adminService.getTags().then((r) => r.data),
  })

  const { data: storyDetails = [], isLoading: detailsLoading } = useQuery({
    queryKey: ['story-details', revisionStory?.id],
    queryFn: () => adminService.getStoryDetails(revisionStory!.id).then((r) => r.data),
    enabled: !!revisionStory,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-stories'] })
    qc.invalidateQueries({ queryKey: ['submitted-stories'] })
  }

  const createMutation  = useMutation({ mutationFn: adminService.createStory, onSuccess: () => { invalidate(); closeDialog() } })
  const updateMutation  = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adminService.updateStory>[1] }) => adminService.updateStory(id, data),
    onSuccess: () => { invalidate(); closeDialog() },
  })
  const deleteMutation  = useMutation({ mutationFn: adminService.deleteStory, onSuccess: () => { invalidate(); setDeleteTarget(null) } })
  const submitMutation  = useMutation({ mutationFn: adminService.submitStory,  onSuccess: invalidate })
  const approveMutation = useMutation({
    mutationFn: ({ id, publishDate }: { id: number; publishDate: string | null }) => adminService.approveStory(id, publishDate),
    onSuccess: () => { invalidate(); setApproveTarget(null) },
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminService.rejectStory(id, reason),
    onSuccess: () => { invalidate(); setRejectTarget(null) },
  })
  const addRevisionMutation = useMutation({
    mutationFn: ({ storyId, data }: { storyId: number; data: Parameters<typeof adminService.addStoryDetail>[1] }) => adminService.addStoryDetail(storyId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['story-details', revisionStory?.id] }); invalidate() },
  })

  const closeDialog = () => { setDialogOpen(false); setEditing(null) }

  const handleSave = (form: StoryFormData) => {
    const base = {
      title: form.title, slug: form.slug || null, description: form.description || null,
      excerpt: form.excerpt || null, coverImageUrl: form.coverImageUrl || null,
      authorName: form.authorName || null, isFeatured: form.isFeatured,
      categoryId: form.categoryId as number, publishDate: form.publishDate || null,
      isPublish: form.isPublish, tagIds: form.tagIds,
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: base })
    } else {
      createMutation.mutate({ ...base, savePath: form.savePath, content: form.content || null, wordCount: form.wordCount, scoreWeight: form.scoreWeight })
    }
  }

  const filtered = search
    ? stories.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.categoryTitle.toLowerCase().includes(search.toLowerCase()) ||
        (s.authorName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : stories

  // ── Columns (shared) ────────────────────────────────────────────────────────

  const titleCol: GridColDef<Story> = {
    field: 'title', headerName: 'Title', flex: 2,
    renderCell: ({ row }) => (
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" alignItems="center" gap={0.5}>
          {row.isFeatured && <StarIcon sx={{ fontSize: 14, color: 'warning.main', flexShrink: 0 }} />}
          <Typography variant="body2" fontWeight={600} noWrap>{row.title}</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" noWrap>{row.categoryTitle}</Typography>
        {row.authorName && <Typography variant="caption" color="text.disabled" display="block" noWrap>{row.authorName}</Typography>}
      </Box>
    ),
  }

  const statusCol: GridColDef<Story> = {
    field: 'status', headerName: 'Status', width: 130,
    renderCell: ({ row }) => (
      <Stack gap={0.5} alignItems="flex-start">
        <StatusChip status={row.status} />
        {row.submittedAt && row.status === 'Submitted' && (
          <Typography variant="caption" color="text.secondary">
            {new Date(row.submittedAt).toLocaleDateString()}
          </Typography>
        )}
      </Stack>
    ),
  }

  const revCol: GridColDef<Story> = {
    field: 'latestDetail', headerName: 'Rev / Words', width: 110,
    renderCell: ({ row }) => (
      <Box>
        <Typography variant="body2">{row.latestDetail ? `rev ${row.latestDetail.revision}` : '—'}</Typography>
        {row.latestDetail?.wordCount ? <Typography variant="caption" color="text.secondary">{row.latestDetail.wordCount}w</Typography> : null}
      </Box>
    ),
  }

  const allStoriesActions: GridColDef<Story> = {
    field: 'actions', headerName: '', width: 200, sortable: false,
    renderCell: ({ row }) => (
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Tooltip title="Revisions"><IconButton size="small" onClick={() => setRevisionStory(row)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title={row.status === 'Submitted' ? 'Cannot edit — under review' : 'Edit'}>
          <span>
            <IconButton size="small" disabled={row.status === 'Submitted'} onClick={() => { setEditing(row); setDialogOpen(true) }}><EditIcon fontSize="small" /></IconButton>
          </span>
        </Tooltip>
        {row.storyType === 'Interactive' && (
          <Tooltip title="Edit Nodes">
            <IconButton size="small" color="primary" onClick={() => navigate(`/stories/${row.id}/nodes`)}><AccountTreeIcon fontSize="small" /></IconButton>
          </Tooltip>
        )}
        {(row.status === 'Draft' || row.status === 'Rejected') && (
          <Tooltip title="Submit for Review">
            <IconButton size="small" color="primary" onClick={() => submitMutation.mutate(row.id)} disabled={submitMutation.isPending}>
              <SendIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
      </Stack>
    ),
  }

  const reviewActions: GridColDef<Story> = {
    field: 'actions', headerName: '', width: 220, sortable: false,
    renderCell: ({ row }) => (
      <Stack direction="row" alignItems="center" gap={1}>
        <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />}
          onClick={() => setApproveTarget(row)}>Approve</Button>
        <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />}
          onClick={() => setRejectTarget(row)}>Reject</Button>
      </Stack>
    ),
  }

  const allColumns: GridColDef<Story>[] = [titleCol, statusCol, revCol, allStoriesActions]
  const reviewColumns: GridColDef<Story>[] = [
    titleCol,
    {
      field: 'submittedAt', headerName: 'Submitted', width: 120,
      renderCell: ({ row }) => row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '—',
    },
    revCol,
    reviewActions,
  ]

  return (
    <Box>
      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Stories</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setDialogOpen(true) }}>
          New Story
        </Button>
      </Stack>

      {/* ── Page tabs ── */}
      <Tabs value={pageTab} onChange={(_, v) => setPageTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="All Stories" />
        {isStaff && (
          <Tab
            label={submitted.length > 0 ? `Pending Review (${submitted.length})` : 'Pending Review'}
            icon={submitted.length > 0 ? <Chip label={submitted.length} size="small" color="warning" sx={{ ml: 0.5 }} /> : undefined}
            iconPosition="end"
          />
        )}
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load stories.</Alert>}

      {/* ── All Stories tab ── */}
      {pageTab === 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <TextField
              placeholder="Search by title, category, or author…"
              size="small" value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 320 }}
            />
          </Box>
          <Box sx={{ height: 560, width: '100%' }}>
            <DataGrid rows={filtered} columns={allColumns} loading={isLoading} hideFooter rowHeight={72} disableColumnMenu disableRowSelectionOnClick />
          </Box>
        </>
      )}

      {/* ── Pending Review tab ── */}
      {pageTab === 1 && isStaff && (
        <>
          {submitted.length === 0 && !submittedLoading && (
            <Alert severity="info" icon={<CheckCircleIcon />}>
              No stories are currently awaiting review. Great work!
            </Alert>
          )}
          <Box sx={{ height: 560, width: '100%' }}>
            <DataGrid rows={submitted} columns={reviewColumns} loading={submittedLoading} hideFooter rowHeight={72} disableColumnMenu disableRowSelectionOnClick />
          </Box>
        </>
      )}

      {/* ── Dialogs ── */}
      <StoryDialog open={dialogOpen} story={editing} categories={categories} tags={tags}
        onClose={closeDialog} onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending} />

      {revisionStory && (
        <RevisionDialog open={!!revisionStory} story={revisionStory} details={storyDetails}
          detailsLoading={detailsLoading} onClose={() => setRevisionStory(null)}
          onAddRevision={(data) => addRevisionMutation.mutate({ storyId: revisionStory.id, data })}
          saving={addRevisionMutation.isPending} />
      )}

      <ApproveDialog story={approveTarget} onClose={() => setApproveTarget(null)}
        onConfirm={(publishDate) => approveTarget && approveMutation.mutate({ id: approveTarget.id, publishDate })}
        saving={approveMutation.isPending} />

      <RejectDialog story={rejectTarget} onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => rejectTarget && rejectMutation.mutate({ id: rejectTarget.id, reason })}
        saving={rejectMutation.isPending} />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Story</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scheduled pill ─ shown when approve dialog is open with a future date */}
      {approveMutation.isPending && (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
          <Chip icon={<ScheduleIcon />} label="Publishing…" color="success" />
        </Box>
      )}
    </Box>
  )
}
