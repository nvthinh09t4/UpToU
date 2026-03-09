import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControlLabel,
  IconButton, InputAdornment, Switch,
  TextField, Tooltip, Typography, Autocomplete, Tab, Tabs,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import HistoryIcon from '@mui/icons-material/History'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import StarIcon from '@mui/icons-material/Star'
import { adminService } from '@/services/adminService'
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

// ── Story dialog ──────────────────────────────────────────────────────────────

interface StoryDialogProps {
  open: boolean; story: Story | null; categories: Category[]; tags: Tag[]
  onClose: () => void; onSave: (data: StoryFormData) => void; saving: boolean
}

function StoryDialog({ open, story, categories, tags, onClose, onSave, saving }: StoryDialogProps) {
  const allCats = flattenCategories(categories)
  const [tab, setTab] = useState(0)

  const [form, setForm] = useState<StoryFormData>(
    story
      ? {
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
        }
      : EMPTY_FORM
  )

  const set = <K extends keyof StoryFormData>(key: K, value: StoryFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const selectedTags = tags.filter((t) => form.tagIds.includes(t.id))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{story ? `Edit — ${story.title}` : 'New Story'}</DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Metadata" />
        <Tab label="Content" disabled={!!story} />
      </Tabs>

      <DialogContent>
        {tab === 0 && (
          <Box className="flex flex-col gap-4 pt-2">
            <Box className="flex gap-3">
              <TextField label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} fullWidth required />
              <TextField
                label="Slug"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                sx={{ flex: 1 }}
                placeholder="auto-generated"
              />
            </Box>
            <TextField label="Excerpt" value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} fullWidth multiline rows={2} helperText="Short teaser shown on category cards" />
            <TextField label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} fullWidth multiline rows={2} helperText="Internal admin description" />
            <TextField label="Cover Image URL" value={form.coverImageUrl} onChange={(e) => set('coverImageUrl', e.target.value)} fullWidth placeholder="https://..." />
            <Box className="flex gap-3">
              <TextField label="Author Name" value={form.authorName} onChange={(e) => set('authorName', e.target.value)} sx={{ flex: 1 }} />
              <TextField
                label="Publish Date" type="date" value={form.publishDate}
                onChange={(e) => set('publishDate', e.target.value)}
                InputLabelProps={{ shrink: true }} sx={{ flex: 1 }}
              />
            </Box>
            <Autocomplete
              multiple options={tags} getOptionLabel={(t) => t.name}
              value={tags.filter((t) => form.tagIds.includes(t.id))}
              onChange={(_, v) => set('tagIds', v.map((t) => t.id))}
              renderInput={(params) => <TextField {...params} label="Tags" />}
              renderTags={(value, getTagProps) =>
                value.map((tag, index) => <Chip label={tag.name} size="small" {...getTagProps({ index })} key={tag.id} />)
              }
            />
            <Autocomplete
              options={allCats}
              getOptionLabel={(c) => c.parentId ? `↳ ${c.title}` : c.title}
              value={allCats.find((c) => c.id === form.categoryId) ?? null}
              onChange={(_, v) => set('categoryId', v?.id ?? '')}
              renderInput={(params) => <TextField {...params} label="Category" required />}
            />
            <Box className="flex gap-6">
              <FormControlLabel control={<Switch checked={form.isPublish} onChange={(e) => set('isPublish', e.target.checked)} />} label="Published" />
              <FormControlLabel control={<Switch checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />} label="Featured" />
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box className="flex flex-col gap-4 pt-2">
            <Box className="flex gap-3">
              <TextField label="Save Path" value={form.savePath} onChange={(e) => set('savePath', e.target.value)} sx={{ flex: 1 }} placeholder="stories/category/filename.md" />
              <TextField
                label="Score Weight" type="number" value={form.scoreWeight}
                onChange={(e) => set('scoreWeight', parseFloat(e.target.value) || 1)}
                inputProps={{ step: 0.1, min: 0 }} sx={{ width: 140 }}
              />
            </Box>
            <TextField
              label="Content (Markdown)"
              value={form.content}
              onChange={(e) => {
                set('content', e.target.value)
                set('wordCount', countWords(e.target.value))
              }}
              fullWidth multiline rows={16}
              helperText={`${form.wordCount} words · ~${Math.max(1, Math.round(form.wordCount / 200))} min read`}
              inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          disabled={saving || !form.title.trim() || !form.categoryId}
          onClick={() => onSave(form)}
        >
          {saving ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Revision dialog ───────────────────────────────────────────────────────────

interface RevisionDialogProps {
  open: boolean; story: Story | null; details: StoryDetail[]; detailsLoading: boolean
  onClose: () => void; onAddRevision: (data: { savePath: string; content: string | null; wordCount: number; changeNotes: string | null; scoreWeight: number; isPublish: boolean }) => void
  saving: boolean
}

function RevisionDialog({ open, story, details, detailsLoading, onClose, onAddRevision, saving }: RevisionDialogProps) {
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
          <Box className="flex justify-center py-8"><CircularProgress /></Box>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>History</Typography>
            {details.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No revisions yet.</Typography>
            ) : (
              <Box className="mb-4 flex flex-col gap-2">
                {details.map((d) => (
                  <Box key={d.id} className="flex items-center gap-3 rounded border p-2 text-sm">
                    <Chip label={`rev ${d.revision}`} size="small" color={d.isPublish ? 'success' : 'default'} variant="outlined" />
                    <span className="flex-1 truncate text-gray-600">{d.savePath}</span>
                    {d.changeNotes && <span className="text-xs text-gray-400 italic truncate max-w-[180px]">{d.changeNotes}</span>}
                    <span className="text-xs text-gray-400">{d.wordCount}w</span>
                    <span className="text-xs text-gray-400">{new Date(d.createdOn).toLocaleDateString()}</span>
                  </Box>
                ))}
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Add New Revision</Typography>
            <Box className="flex flex-col gap-3">
              <Box className="flex gap-3">
                <TextField label="Save Path" value={savePath} onChange={(e) => setSavePath(e.target.value)} sx={{ flex: 1 }} placeholder="stories/category/filename-v2.md" />
                <TextField label="Score Weight" type="number" value={scoreWeight} onChange={(e) => setScoreWeight(parseFloat(e.target.value) || 1)} inputProps={{ step: 0.1, min: 0 }} sx={{ width: 140 }} />
              </Box>
              <TextField
                label="Content (Markdown)" value={content} onChange={(e) => setContent(e.target.value)}
                fullWidth multiline rows={10}
                helperText={`${wordCount} words · ~${Math.max(1, Math.round(wordCount / 200))} min read`}
                inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
              />
              <TextField label="Change Notes" value={changeNotes} onChange={(e) => setChangeNotes(e.target.value)} fullWidth placeholder="What changed in this revision?" />
              <FormControlLabel control={<Switch checked={isPublish} onChange={(e) => setIsPublish(e.target.checked)} />} label="Publish this revision immediately" />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained" startIcon={<AddCircleIcon />}
          disabled={saving || !savePath.trim()}
          onClick={() => onAddRevision({ savePath, content: content || null, wordCount, changeNotes: changeNotes || null, scoreWeight, isPublish })}
        >
          {saving ? <CircularProgress size={20} /> : 'Add Revision'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StoriesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Story | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null)
  const [revisionStory, setRevisionStory] = useState<Story | null>(null)

  const { data: stories = [], isLoading, error } = useQuery({
    queryKey: ['admin-stories'],
    queryFn: () => adminService.getStories().then((r) => r.data),
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

  const filtered = search
    ? stories.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.categoryTitle.toLowerCase().includes(search.toLowerCase()) ||
        (s.authorName ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : stories

  const createMutation = useMutation({
    mutationFn: adminService.createStory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-stories'] }); closeDialog() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adminService.updateStory>[1] }) =>
      adminService.updateStory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-stories'] }); closeDialog() },
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteStory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-stories'] }); setDeleteTarget(null) },
  })

  const addRevisionMutation = useMutation({
    mutationFn: ({ storyId, data }: { storyId: number; data: Parameters<typeof adminService.addStoryDetail>[1] }) =>
      adminService.addStoryDetail(storyId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['story-details', revisionStory?.id] })
      qc.invalidateQueries({ queryKey: ['admin-stories'] })
    },
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
      createMutation.mutate({
        ...base,
        savePath: form.savePath,
        content: form.content || null,
        wordCount: form.wordCount,
        scoreWeight: form.scoreWeight,
      })
    }
  }

  const columns: GridColDef<Story>[] = [
    {
      field: 'title', headerName: 'Title', flex: 2,
      renderCell: ({ row }) => (
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {row.isFeatured && <StarIcon sx={{ fontSize: 14, color: 'warning.main', flexShrink: 0 }} />}
            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }} noWrap>{row.title}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap>{row.categoryTitle}</Typography>
          {row.authorName && <Typography variant="caption" color="text.disabled" noWrap>{row.authorName}</Typography>}
        </Box>
      ),
    },
    {
      field: 'tags', headerName: 'Tags', flex: 1.2,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
          {row.tags.map((tag) => <Chip key={tag.id} label={tag.name} size="small" variant="outlined" />)}
          {row.tags.length === 0 && <Typography variant="caption" color="text.secondary">—</Typography>}
        </Box>
      ),
    },
    {
      field: 'isPublish', headerName: 'Status', width: 110,
      renderCell: ({ row }) => (
        <Chip
          label={row.isDeleted ? 'Deleted' : row.isPublish ? 'Published' : 'Draft'}
          size="small"
          color={row.isDeleted ? 'error' : row.isPublish ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'publishDate', headerName: 'Published', width: 110,
      renderCell: ({ row }) => row.publishDate ? new Date(row.publishDate).toLocaleDateString() : '—',
    },
    {
      field: 'latestDetail', headerName: 'Rev / Words', width: 110,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2">
            {row.latestDetail ? `rev ${row.latestDetail.revision}` : '—'}
          </Typography>
          {row.latestDetail?.wordCount ? (
            <Typography variant="caption" color="text.secondary">{row.latestDetail.wordCount}w</Typography>
          ) : null}
        </Box>
      ),
    },
    {
      field: 'actions', headerName: '', width: 120, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Revisions"><IconButton size="small" onClick={() => setRevisionStory(row)}><HistoryIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditing(row); setDialogOpen(true) }}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Typography variant="h5" fontWeight={700}>Stories</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setDialogOpen(true) }}>
          New Story
        </Button>
      </Box>

      <Box className="mb-4">
        <TextField
          placeholder="Search by title, category, or author…"
          size="small" value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 320 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load stories.</Alert>}

      <Box sx={{ height: 580, width: '100%' }}>
        <DataGrid rows={filtered} columns={columns} loading={isLoading} hideFooter rowHeight={70} disableColumnMenu disableRowSelectionOnClick />
      </Box>

      <StoryDialog open={dialogOpen} story={editing} categories={categories} tags={tags} onClose={closeDialog} onSave={handleSave} saving={createMutation.isPending || updateMutation.isPending} />

      {revisionStory && (
        <RevisionDialog
          open={!!revisionStory} story={revisionStory} details={storyDetails}
          detailsLoading={detailsLoading} onClose={() => setRevisionStory(null)}
          onAddRevision={(data) => addRevisionMutation.mutate({ storyId: revisionStory.id, data })}
          saving={addRevisionMutation.isPending}
        />
      )}

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Story</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This will soft-delete the story.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
