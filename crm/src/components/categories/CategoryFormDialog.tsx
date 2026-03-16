import { useState } from 'react'
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, MenuItem, Select, Switch, Tab, Tabs, TextField,
} from '@mui/material'
import type { Category } from '@/types'
import { ScoreTypesPanel } from './ScoreTypesPanel'
import { BadgesPanel } from './BadgesPanel'

export type CategoryFormData = {
  title: string
  description: string
  isActive: boolean
  scoreWeight: number
  orderToShow: number
  parentId: number | null
}

export const EMPTY_CATEGORY_FORM: CategoryFormData = {
  title: '',
  description: '',
  isActive: true,
  scoreWeight: 1,
  orderToShow: 0,
  parentId: null,
}

export interface CategoryFormDialogProps {
  open: boolean
  category: Category | null
  allCategories: Category[]
  onClose: () => void
  onSave: (data: CategoryFormData) => void
  saving: boolean
}

export function CategoryFormDialog({ open, category, allCategories, onClose, onSave, saving }: CategoryFormDialogProps) {
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState<CategoryFormData>(
    category
      ? {
          title: category.title,
          description: category.description ?? '',
          isActive: category.isActive,
          scoreWeight: category.scoreWeight,
          orderToShow: category.orderToShow,
          parentId: category.parentId,
        }
      : EMPTY_CATEGORY_FORM
  )

  const handleClose = () => { setTab(0); onClose() }

  const set = <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const rootCategories = allCategories.filter((c) => c.parentId === null && c.id !== category?.id)

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{category ? `Edit — ${category.title}` : 'New Category'}</DialogTitle>

      {category && (
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Details" />
          <Tab label="Score Types" />
          <Tab label="Badges" />
        </Tabs>
      )}

      <DialogContent sx={{ pt: 3 }}>
        {/* Tab 0 — Category fields */}
        {tab === 0 && (
          <Box className="flex flex-col gap-4">
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <Box className="flex gap-4">
              <TextField
                label="Score Weight"
                type="number"
                value={form.scoreWeight}
                onChange={(e) => set('scoreWeight', parseFloat(e.target.value) || 1)}
                inputProps={{ step: 0.1, min: 0 }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Order"
                type="number"
                value={form.orderToShow}
                onChange={(e) => set('orderToShow', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0 }}
                sx={{ flex: 1 }}
              />
            </Box>
            <Select
              value={form.parentId ?? ''}
              onChange={(e) => set('parentId', (e.target.value as unknown as string) === '' ? null : Number(e.target.value))}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">— No parent (root category) —</MenuItem>
              {rootCategories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
              ))}
            </Select>
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />}
              label="Active"
            />
          </Box>
        )}

        {/* Tab 1 — Score Types */}
        {tab === 1 && category && <ScoreTypesPanel categoryId={category.id} />}

        {/* Tab 2 — Badges */}
        {tab === 2 && category && <BadgesPanel categoryId={category.id} />}
      </DialogContent>

      {tab === 0 && (
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            disabled={saving || !form.title.trim()}
            onClick={() => onSave(form)}
          >
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      )}
      {tab !== 0 && (
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      )}
    </Dialog>
  )
}
