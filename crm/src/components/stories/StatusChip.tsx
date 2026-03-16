import { Chip } from '@mui/material'
import type { Story } from '@/types'

type StatusColor = 'default' | 'warning' | 'info' | 'success' | 'error'

const STATUS_META: Record<Story['status'], { color: StatusColor; label: string }> = {
  Draft:     { color: 'default',  label: 'Draft' },
  Submitted: { color: 'warning',  label: 'Under Review' },
  Approved:  { color: 'info',     label: 'Scheduled' },
  Published: { color: 'success',  label: 'Published' },
  Rejected:  { color: 'error',    label: 'Rejected' },
}

export function StatusChip({ status }: { status: Story['status'] }) {
  const { color, label } = STATUS_META[status] ?? { color: 'default', label: status }
  return <Chip label={label} size="small" color={color} variant="outlined" />
}
