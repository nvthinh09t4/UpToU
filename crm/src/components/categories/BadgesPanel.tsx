import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Chip, CircularProgress, IconButton, TextField, Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import { adminService } from '@/services/adminService'
import type { CategoryBadge } from '@/types'

const BADGE_TIER_LABELS: Record<number, string> = {
  1: 'Apprentice', 2: 'Practitioner', 3: 'Expert', 4: 'Master', 5: 'Grandmaster',
}

export function BadgesPanel({ categoryId }: { categoryId: number }) {
  const qc = useQueryClient()
  const [editTier, setEditTier] = useState<number | null>(null)
  const [editValues, setEditValues] = useState<Partial<CategoryBadge>>({})

  const { data: badges = [], isLoading } = useQuery({
    queryKey: ['crm-badges', categoryId],
    queryFn: () => adminService.getBadges(categoryId).then((r) => r.data),
  })

  const upsertMutation = useMutation({
    mutationFn: (data: Partial<CategoryBadge> & { tier: number }) =>
      adminService.upsertBadge(categoryId, {
        id: data.id,
        tier: data.tier,
        label: data.label!,
        labelVi: data.labelVi ?? undefined,
        scoreThreshold: data.scoreThreshold ?? 0,
        badgeImageUrl: data.badgeImageUrl ?? undefined,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['crm-badges', categoryId] }); setEditTier(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteBadge,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-badges', categoryId] }),
  })

  const startEdit = (tier: number) => {
    const existing = badges.find((b) => b.tier === tier)
    setEditValues(existing ?? { tier, label: '', labelVi: '', scoreThreshold: 0, badgeImageUrl: '' })
    setEditTier(tier)
  }

  if (isLoading) return <Box sx={{ py: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>

  return (
    <Box>
      {[1, 2, 3, 4, 5].map((tier) => {
        const badge = badges.find((b) => b.tier === tier)
        const isEditing = editTier === tier

        return (
          <Box key={tier} sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: isEditing ? 1.5 : 0 }}>
              <Chip label={`Tier ${tier}`} size="small" color={badge ? 'primary' : 'default'} variant={badge ? 'filled' : 'outlined'} />
              <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                {BADGE_TIER_LABELS[tier]}
                {badge && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>— {badge.label} (≥{badge.scoreThreshold})</Typography>}
              </Typography>
              {!isEditing && (
                <>
                  <Tooltip title={badge ? 'Edit badge' : 'Add badge'}>
                    <IconButton size="small" onClick={() => startEdit(tier)}>
                      {badge ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  {badge && (
                    <Tooltip title="Remove badge">
                      <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(badge.id)} disabled={deleteMutation.isPending}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}
            </Box>

            {isEditing && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <TextField label="Label (EN) *" size="small" value={editValues.label ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, label: e.target.value }))} sx={{ flex: 1, minWidth: 140 }} />
                <TextField label="Label (VI)" size="small" value={editValues.labelVi ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, labelVi: e.target.value }))} sx={{ flex: 1, minWidth: 140 }} />
                <TextField label="Score Threshold" size="small" type="number" value={editValues.scoreThreshold ?? 0} onChange={(e) => setEditValues((v) => ({ ...v, scoreThreshold: parseInt(e.target.value) || 0 }))} sx={{ width: 130 }} />
                <TextField label="Badge Image URL" size="small" value={editValues.badgeImageUrl ?? ''} onChange={(e) => setEditValues((v) => ({ ...v, badgeImageUrl: e.target.value }))} sx={{ flex: 2, minWidth: 180 }} />
                <Box sx={{ display: 'flex', gap: 0.5, pt: 0.5 }}>
                  <Button size="small" variant="contained" disabled={upsertMutation.isPending || !editValues.label?.trim()} onClick={() => upsertMutation.mutate({ ...editValues, tier } as Partial<CategoryBadge> & { tier: number })}>
                    {upsertMutation.isPending ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                  </Button>
                  <Button size="small" onClick={() => setEditTier(null)}>Cancel</Button>
                </Box>
              </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
