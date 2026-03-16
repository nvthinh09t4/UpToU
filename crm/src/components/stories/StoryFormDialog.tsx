import { useState } from 'react'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControlLabel,
  Stack, Switch, Tab, Tabs, TextField, Typography, Autocomplete,
} from '@mui/material'
import type { Category, Story, Tag } from '@/types'
import { StatusChip } from './StatusChip'

// ── Types ─────────────────────────────────────────────────────────────────────

export type StoryFormData = {
  title: string; slug: string; description: string; excerpt: string
  coverImageUrl: string; authorName: string; isFeatured: boolean
  categoryId: number | ''; publishDate: string; isPublish: boolean; tagIds: number[]
  savePath: string; content: string; wordCount: number; scoreWeight: number
}

export const EMPTY_FORM: StoryFormData = {
  title: '', slug: '', description: '', excerpt: '', coverImageUrl: '',
  authorName: '', isFeatured: false, categoryId: '', publishDate: '',
  isPublish: false, tagIds: [], savePath: '', content: '', wordCount: 0, scoreWeight: 1,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function flattenCategories(cats: Category[]): Category[] {
  return cats.flatMap((c) => [c, ...flattenCategories(c.children)])
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

// ── Story dialog ──────────────────────────────────────────────────────────────

export function StoryFormDialog({ open, story, categories, tags, onClose, onSave, saving }: {
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
