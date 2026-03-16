import { useState } from 'react'
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, TextField, Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import type { Story } from '@/types'

// ── Approve dialog ────────────────────────────────────────────────────────────

export function ApproveDialog({ story, onClose, onConfirm, saving }: {
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

export function RejectDialog({ story, onClose, onConfirm, saving }: {
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
