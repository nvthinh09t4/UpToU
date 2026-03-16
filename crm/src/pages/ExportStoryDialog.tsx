import { useState } from 'react'
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, Typography,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import type { Story, StoryDetail, StoryNodeGraph } from '@/types'

// ── JSON builder ──────────────────────────────────────────────────────────────

function nodeRef(id: number) {
  return `node-${id}`
}

function buildJson(story: Story, detail: StoryDetail, graph: StoryNodeGraph | null) {
  const nodes = (graph?.nodes ?? []).map((n) => {
    const answers = n.answers.map((a, j) => {
      const ans: Record<string, unknown> = {
        text: a.text,
        sortOrder: a.sortOrder ?? j + 1,
      }
      if (a.pointsAwarded) ans.pointsAwarded = a.pointsAwarded
      if (a.nextNodeId != null) ans.nextNodeRef = nodeRef(a.nextNodeId)
      else ans.nextNodeRef = null
      if (a.color) ans.color = a.color
      if (a.feedback) ans.feedback = a.feedback
      if (a.feedbackVi) ans.feedbackVi = a.feedbackVi
      if (a.scoreDeltas && Object.keys(a.scoreDeltas).length > 0) ans.scoreDeltas = a.scoreDeltas
      if (a.branchWeights && Object.keys(a.branchWeights).length > 0) ans.branchWeights = a.branchWeights
      return ans
    })

    const node: Record<string, unknown> = {
      ref: nodeRef(n.id),
      question: n.question,
      isStart: n.isStart,
      sortOrder: n.sortOrder,
      answers,
    }
    if (n.questionSubtitle) node.questionSubtitle = n.questionSubtitle
    if (n.backgroundColor) node.backgroundColor = n.backgroundColor
    if (n.backgroundImageUrl) node.backgroundImageUrl = n.backgroundImageUrl
    if (n.videoUrl) node.videoUrl = n.videoUrl
    if (n.animationType) node.animationType = n.animationType
    return node
  })

  const json: Record<string, unknown> = {
    title: story.title,
    categoryId: story.categoryId,
    storyType: story.storyType,
    savePath: detail.savePath,
    scoreWeight: detail.scoreWeight,
    nodes,
  }
  if (story.description) json.description = story.description
  if (story.excerpt) json.excerpt = story.excerpt
  if (story.coverImageUrl) json.coverImageUrl = story.coverImageUrl
  if (story.authorName) json.authorName = story.authorName

  return json
}

function triggerDownload(json: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Dialog ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  story: Story | null
}

export default function ExportStoryDialog({ open, onClose, story }: Props) {
  const [selectedDetailId, setSelectedDetailId] = useState<number | ''>('')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isInteractive = story?.storyType === 'Interactive'

  const { data: details = [], isLoading: detailsLoading } = useQuery({
    queryKey: ['story-details', story?.id],
    queryFn: () => adminService.getStoryDetails(story!.id).then((r) => r.data),
    enabled: open && !!story?.id,
  })

  // Resolve which detail to export: selected → latest in list → latestDetail on story
  const sortedDetails = [...details].sort((a, b) => b.revision - a.revision)
  const effectiveDetail =
    (selectedDetailId !== '' ? details.find((d) => d.id === selectedDetailId) : null) ??
    sortedDetails[0] ??
    story?.latestDetail ??
    null

  function handleClose() {
    setSelectedDetailId('')
    setError(null)
    onClose()
  }

  async function handleExport() {
    if (!story || !effectiveDetail) return
    setExporting(true)
    setError(null)
    try {
      let graph: StoryNodeGraph | null = null
      if (isInteractive) {
        const resp = await adminService.getStoryNodeGraph(effectiveDetail.id)
        graph = resp.data
      }

      const json = buildJson(story, effectiveDetail, graph)
      const safeName = story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
      triggerDownload(json, `${safeName}-rev${effectiveDetail.revision}.json`)
      handleClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (!story) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          <DownloadIcon color="primary" />
          Export Story as JSON
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {/* Story summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            {story.title}
          </Typography>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary">{story.categoryTitle}</Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="caption" color="text.secondary">{story.storyType}</Typography>
            <Typography variant="caption" color="text.disabled">·</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {story.status}
            </Typography>
          </Stack>
        </Box>

        {/* Revision selector — only for interactive stories that have been loaded */}
        {isInteractive && (
          detailsLoading ? (
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">Loading revisions…</Typography>
            </Stack>
          ) : sortedDetails.length > 1 ? (
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Revision to export</InputLabel>
              <Select
                label="Revision to export"
                value={selectedDetailId !== '' ? selectedDetailId : (effectiveDetail?.id ?? '')}
                onChange={(e) => setSelectedDetailId(e.target.value as number)}
              >
                {sortedDetails.map((d, i) => (
                  <MenuItem key={d.id} value={d.id}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <AccountTreeIcon fontSize="small" sx={{ opacity: 0.5 }} />
                      <span>
                        Rev {d.revision}
                        {i === 0 ? ' — latest' : ''}
                        {d.isPublish ? ' (published)' : ''}
                      </span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : effectiveDetail ? (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Exporting revision {effectiveDetail.revision}
              {effectiveDetail.isPublish ? ' (published)' : ''}.
            </Typography>
          ) : (
            <Typography variant="caption" color="warning.main" display="block" sx={{ mb: 2 }}>
              No story detail found. Only story metadata will be exported.
            </Typography>
          )
        )}

        {!isInteractive && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Non-interactive story — only metadata will be exported (no node graph).
          </Typography>
        )}

        {/* Info box */}
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            The downloaded <code>.json</code> file is compatible with{' '}
            <strong>Import JSON</strong> — use it to duplicate this story or migrate it to another instance.
          </Typography>
        </Box>

        {error && (
          <Typography variant="caption" color="error.main" display="block" sx={{ mt: 1.5 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={handleClose} disabled={exporting}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
          disabled={exporting || (isInteractive && detailsLoading) || !effectiveDetail}
          onClick={handleExport}
        >
          {exporting ? 'Exporting…' : 'Download JSON'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
