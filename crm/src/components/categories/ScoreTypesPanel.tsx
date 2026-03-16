import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, CircularProgress, IconButton, TextField, Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import { adminService } from '@/services/adminService'
import type { CategoryScoreType } from '@/types'

export function ScoreTypesPanel({ categoryId }: { categoryId: number }) {
  const qc = useQueryClient()
  const [editRow, setEditRow] = useState<Partial<CategoryScoreType> | null>(null)

  const { data: scoreTypes = [], isLoading } = useQuery({
    queryKey: ['crm-score-types', categoryId],
    queryFn: () => adminService.getScoreTypes(categoryId).then((r) => r.data),
  })

  const upsertMutation = useMutation({
    mutationFn: (data: Partial<CategoryScoreType>) =>
      adminService.upsertScoreType(categoryId, {
        id: data.id,
        name: data.name!,
        label: data.label ?? undefined,
        scoreWeight: data.scoreWeight ?? 1,
        orderToShow: data.orderToShow ?? 0,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-score-types', categoryId] }); setEditRow(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteScoreType,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-score-types', categoryId] }),
  })

  const [nameErr, setNameErr] = useState('')

  const handleSave = () => {
    if (!editRow) return
    if (!/^[a-z][a-z0-9_]*$/.test(editRow.name ?? '')) {
      setNameErr('Lowercase letters, digits, underscores only. Must start with a letter.')
      return
    }
    setNameErr('')
    upsertMutation.mutate(editRow)
  }

  if (isLoading) return <Box sx={{ py: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setEditRow({ name: '', label: '', scoreWeight: 1, orderToShow: 0 })}>
          Add Score Type
        </Button>
      </Box>

      {/* Inline add/edit form */}
      {editRow && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <TextField
            label="Name *"
            size="small"
            value={editRow.name ?? ''}
            onChange={(e) => { setEditRow((r) => ({ ...r, name: e.target.value })); setNameErr('') }}
            error={!!nameErr}
            helperText={nameErr || 'e.g. capital'}
            sx={{ flex: 1 }}
            inputProps={{ style: { fontFamily: 'monospace' } }}
            disabled={!!editRow.id}
          />
          <TextField
            label="Display Label"
            size="small"
            value={editRow.label ?? ''}
            onChange={(e) => setEditRow((r) => ({ ...r, label: e.target.value }))}
            placeholder="e.g. Capital"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Weight"
            size="small"
            type="number"
            value={editRow.scoreWeight ?? 1}
            onChange={(e) => setEditRow((r) => ({ ...r, scoreWeight: parseFloat(e.target.value) || 1 }))}
            inputProps={{ step: 0.1, min: 0 }}
            sx={{ width: 90 }}
          />
          <TextField
            label="Order"
            size="small"
            type="number"
            value={editRow.orderToShow ?? 0}
            onChange={(e) => setEditRow((r) => ({ ...r, orderToShow: parseInt(e.target.value) || 0 }))}
            sx={{ width: 80 }}
          />
          <Box sx={{ display: 'flex', gap: 0.5, pt: 0.5 }}>
            <Button size="small" variant="contained" onClick={handleSave} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
            </Button>
            <Button size="small" onClick={() => { setEditRow(null); setNameErr('') }}>Cancel</Button>
          </Box>
        </Box>
      )}

      {scoreTypes.length === 0 && !editRow && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No score types yet.
        </Typography>
      )}

      {scoreTypes.map((st) => (
        <Box key={st.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main', flex: 1 }}>
            {st.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{st.label ?? '—'}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ width: 80 }}>w: {st.scoreWeight}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ width: 60 }}>#{st.orderToShow}</Typography>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => setEditRow({ ...st })}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(st.id)} disabled={deleteMutation.isPending}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ))}
    </Box>
  )
}
