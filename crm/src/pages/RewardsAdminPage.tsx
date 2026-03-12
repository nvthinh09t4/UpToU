import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton,
  InputLabel, MenuItem, Paper, Select, Switch, Tab, Tabs,
  TextField, Tooltip, Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import { adminService } from '@/services/adminService'
import type { AdminRewardItem } from '@/types'

const CATEGORIES = ['Title', 'AvatarFrame', 'Avatar', 'StoryAccess', 'NameChange'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_LABELS: Record<Category, string> = {
  Title: 'Title',
  AvatarFrame: 'Avatar Frame',
  Avatar: 'Avatar',
  StoryAccess: 'Story Access',
  NameChange: 'Name Change Ticket',
}

const CATEGORY_COLORS: Record<Category, 'secondary' | 'primary' | 'success' | 'warning' | 'info'> = {
  Title: 'secondary',
  AvatarFrame: 'primary',
  Avatar: 'success',
  StoryAccess: 'warning',
  NameChange: 'info',
}

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  name: string
  description: string
  category: Category
  creditCost: number
  value: string
  previewUrl: string
  isActive: boolean
}

function defaultForm(): FormState {
  return { name: '', description: '', category: 'Title', creditCost: 100, value: '', previewUrl: '', isActive: true }
}

function itemToForm(item: AdminRewardItem): FormState {
  return {
    name: item.name,
    description: item.description ?? '',
    category: item.category,
    creditCost: item.creditCost,
    value: item.value ?? '',
    previewUrl: item.previewUrl ?? '',
    isActive: item.isActive,
  }
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

interface EditDialogProps {
  open: boolean
  item: AdminRewardItem | null // null = create mode
  onClose: () => void
  onSave: (form: FormState) => void
  saving: boolean
}

function EditDialog({ open, item, onClose, onSave, saving }: EditDialogProps) {
  const [form, setForm] = useState<FormState>(item ? itemToForm(item) : defaultForm())

  // Reset when item changes
  const handleOpen = () => setForm(item ? itemToForm(item) : defaultForm())

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth TransitionProps={{ onEnter: handleOpen }}>
      <DialogTitle>{item ? 'Edit Reward Item' : 'Add Reward Item'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} required fullWidth size="small" />

        <FormControl fullWidth size="small">
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value as Category)}>
            {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{CATEGORY_LABELS[c]}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField
          label="Description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          multiline rows={2} fullWidth size="small"
        />

        <TextField
          label="Credit Cost"
          type="number"
          value={form.creditCost}
          onChange={(e) => set('creditCost', Number(e.target.value))}
          inputProps={{ min: 0 }}
          fullWidth size="small"
          InputProps={{ startAdornment: <MonetizationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> }}
        />

        <TextField
          label={form.category === 'Title' ? 'Title Text (Value)' : 'Asset URL (Value)'}
          value={form.value}
          onChange={(e) => set('value', e.target.value)}
          fullWidth size="small"
          helperText={form.category === 'Title' ? "The text displayed as the user's title" : 'URL of the avatar frame / avatar image'}
        />

        <TextField
          label="Preview URL"
          value={form.previewUrl}
          onChange={(e) => set('previewUrl', e.target.value)}
          fullWidth size="small"
          helperText="Thumbnail shown in the reward shop"
        />

        {form.previewUrl && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img src={form.previewUrl} alt="preview" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
            <Typography variant="caption" color="text.secondary">Preview</Typography>
          </Box>
        )}

        {item && (
          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />}
            label={form.isActive ? 'Active (visible in shop)' : 'Inactive (hidden from shop)'}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" disabled={saving || !form.name.trim()} onClick={() => onSave(form)}>
          {saving ? <CircularProgress size={20} /> : item ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RewardsAdminPage() {
  const qc = useQueryClient()
  const [categoryTab, setCategoryTab] = useState<'all' | Category>('all')
  const [editItem, setEditItem] = useState<AdminRewardItem | null | undefined>(undefined) // undefined = closed, null = create
  const [deleteItem, setDeleteItem] = useState<AdminRewardItem | null>(null)

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['admin-rewards', categoryTab],
    queryFn: () =>
      adminService.getAdminRewards(categoryTab === 'all' ? undefined : categoryTab).then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (form: FormState & { id?: number }) => {
      const payload = {
        name: form.name,
        description: form.description || null,
        category: form.category,
        creditCost: form.creditCost,
        value: form.value || null,
        previewUrl: form.previewUrl || null,
        isActive: form.isActive,
      }
      return form.id
        ? adminService.updateReward(form.id, payload)
        : adminService.createReward(payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rewards'] }); setEditItem(undefined) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteReward(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rewards'] }); setDeleteItem(null) },
  })

  // Stats
  const totalItems = items.length
  const activeItems = items.filter((i) => i.isActive).length
  const totalPurchases = items.reduce((s, i) => s + i.purchaseCount, 0)

  const columns: GridColDef<AdminRewardItem>[] = [
    {
      field: 'preview',
      headerName: '',
      width: 52,
      sortable: false,
      renderCell: ({ row }) =>
        row.previewUrl ? (
          <img src={row.previewUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
        ) : row.category === 'Title' ? (
          <Box sx={{ px: 1, py: 0.25, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="caption" fontWeight={700} color="primary.contrastText" noWrap>{row.value ?? row.name}</Typography>
          </Box>
        ) : null,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1.5,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
          {row.description && <Typography variant="caption" color="text.secondary" noWrap>{row.description}</Typography>}
        </Box>
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 130,
      renderCell: ({ row }) => (
        <Chip label={CATEGORY_LABELS[row.category]} size="small" color={CATEGORY_COLORS[row.category]} />
      ),
    },
    {
      field: 'creditCost',
      headerName: 'Cost',
      width: 100,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <MonetizationOnIcon fontSize="small" sx={{ color: '#f59e0b' }} />
          <Typography variant="body2" fontWeight={600}>{row.creditCost.toLocaleString()}</Typography>
        </Box>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: ({ row }) => (
        <Chip label={row.isActive ? 'Active' : 'Inactive'} size="small" color={row.isActive ? 'success' : 'default'} />
      ),
    },
    {
      field: 'purchaseCount',
      headerName: 'Purchases',
      width: 100,
      renderCell: ({ row }) => (
        <Typography variant="body2" fontWeight={row.purchaseCount > 0 ? 600 : 400} color={row.purchaseCount > 0 ? 'text.primary' : 'text.disabled'}>
          {row.purchaseCount.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      flex: 1,
      renderCell: ({ row }) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: '',
      width: 90,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => setEditItem(row)}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" disabled={row.purchaseCount > 0} onClick={() => setDeleteItem(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Reward Shop</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditItem(null)}>
          Add Item
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Items', value: totalItems },
          { label: 'Active Items', value: activeItems },
          { label: 'Total Purchases', value: totalPurchases },
        ].map(({ label, value }) => (
          <Paper key={label} sx={{ px: 3, py: 1.5, flex: 1, minWidth: 120 }}>
            <Typography variant="h5" fontWeight={700}>{value}</Typography>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Category tabs */}
      <Tabs
        value={categoryTab}
        onChange={(_, v) => setCategoryTab(v as 'all' | Category)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="all" label="All" />
        {CATEGORIES.map((c) => <Tab key={c} value={c} label={CATEGORY_LABELS[c]} />)}
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load reward items.</Alert>}

      <Box sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={items}
          columns={columns}
          loading={isLoading}
          hideFooter={items.length <= 100}
          rowHeight={64}
          disableColumnMenu
          disableRowSelectionOnClick
        />
      </Box>

      {/* Edit/Create dialog */}
      <EditDialog
        open={editItem !== undefined}
        item={editItem ?? null}
        onClose={() => setEditItem(undefined)}
        saving={saveMutation.isPending}
        onSave={(form) => saveMutation.mutate({ ...form, id: editItem?.id })}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteItem} onClose={() => setDeleteItem(null)}>
        <DialogTitle>Delete Reward Item</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{deleteItem?.name}</strong>? This cannot be undone. Items with purchases cannot be deleted — disable them instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteItem(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={deleteMutation.isPending}
            onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}>
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
