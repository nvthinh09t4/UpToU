import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel,
  IconButton, InputAdornment, Stack, Switch, Tab, Tabs,
  TextField, Tooltip, Typography,
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
import UploadFileIcon from '@mui/icons-material/UploadFile'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { adminService } from '@/services/adminService'
import { useAuthStore } from '@/store/authStore'
import type { Category, Story, StoryDetail, Tag } from '@/types'
import ImportStoryDialog from './ImportStoryDialog'
import ExportStoryDialog from './ExportStoryDialog'
import { StatusChip } from '@/components/stories/StatusChip'
import { ApproveDialog, RejectDialog } from '@/components/stories/ApproveRejectDialogs'
import { StoryFormDialog, type StoryFormData, flattenCategories, countWords } from '@/components/stories/StoryFormDialog'

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
  const [importOpen, setImportOpen] = useState(false)
  const [exportTarget, setExportTarget] = useState<Story | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
  const deleteMutation  = useMutation({
    mutationFn: adminService.deleteStory,
    onSuccess: () => { invalidate(); setDeleteTarget(null); setDeleteError(null) },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      setDeleteError(status === 403 ? 'You do not have permission to delete stories.' : 'Failed to delete story. Please try again.')
    },
  })
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

  const handleImported = async (storyId: number) => {
    try {
      const { data: fresh } = await adminService.getStories()
      qc.setQueryData(['admin-stories'], fresh)
      const story = fresh.find((s) => s.id === storyId) ?? null
      if (story) { setEditing(story); setDialogOpen(true) }
    } catch {
      invalidate()
    }
  }

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
    field: 'actions', headerName: '', width: 230, sortable: false,
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
        <Tooltip title="Export as JSON">
          <IconButton size="small" onClick={() => setExportTarget(row)}><FileDownloadIcon fontSize="small" /></IconButton>
        </Tooltip>
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
        <Stack direction="row" gap={1}>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => setImportOpen(true)}>
            Import JSON
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setDialogOpen(true) }}>
            New Story
          </Button>
        </Stack>
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
      <ImportStoryDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        categories={flattenCategories(categories)}
        onImported={handleImported}
      />

      <ExportStoryDialog
        open={exportTarget !== null}
        onClose={() => setExportTarget(null)}
        story={exportTarget}
      />

      <StoryFormDialog open={dialogOpen} story={editing} categories={categories} tags={tags}
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

      <Dialog open={!!deleteTarget} onClose={() => { setDeleteTarget(null); setDeleteError(null) }}>
        <DialogTitle>Delete Story</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?</Typography>
          {deleteError && <Alert severity="error" sx={{ mt: 1.5 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteTarget(null); setDeleteError(null) }}>Cancel</Button>
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
