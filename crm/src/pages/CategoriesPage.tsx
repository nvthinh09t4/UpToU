import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, FormControlLabel,
  IconButton, InputAdornment, MenuItem, Select, Switch,
  TextField, Tooltip, Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import { adminService } from '@/services/adminService'
import type { Category } from '@/types'

type CategoryFormData = {
  title: string
  description: string
  isActive: boolean
  scoreWeight: number
  orderToShow: number
  parentId: number | null
}

const EMPTY_FORM: CategoryFormData = {
  title: '',
  description: '',
  isActive: true,
  scoreWeight: 1,
  orderToShow: 0,
  parentId: null,
}

interface CategoryDialogProps {
  open: boolean
  category: Category | null
  allCategories: Category[]
  onClose: () => void
  onSave: (data: CategoryFormData) => void
  saving: boolean
}

function CategoryDialog({ open, category, allCategories, onClose, onSave, saving }: CategoryDialogProps) {
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
      : EMPTY_FORM
  )

  const set = <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const rootCategories = allCategories.filter((c) => c.parentId === null && c.id !== category?.id)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{category ? `Edit — ${category.title}` : 'New Category'}</DialogTitle>
      <DialogContent className="flex flex-col gap-4 pt-4!">
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
          onChange={(e) => set('parentId', e.target.value === '' ? null : Number(e.target.value))}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          disabled={saving || !form.title.trim()}
          onClick={() => onSave(form)}
        >
          {saving ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function flattenCategories(cats: Category[]): Category[] {
  return cats.flatMap((c) => [c, ...flattenCategories(c.children)])
}

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const { data: tree = [], isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminService.getCategories().then((r) => r.data),
  })

  const allFlat = flattenCategories(tree)
  const filtered = search
    ? allFlat.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : allFlat

  const createMutation = useMutation({
    mutationFn: adminService.createCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); closeDialog() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adminService.updateCategory>[1] }) =>
      adminService.updateCategory(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); closeDialog() },
  })

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); setDeleteTarget(null) },
  })

  const closeDialog = () => { setDialogOpen(false); setEditing(null) }

  const handleSave = (form: CategoryFormData) => {
    const payload = {
      title: form.title,
      description: form.description || null,
      isActive: form.isActive,
      scoreWeight: form.scoreWeight,
      orderToShow: form.orderToShow,
      parentId: form.parentId,
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const columns: GridColDef<Category>[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1.5,
      renderCell: ({ row }) => (
        <Box className="flex flex-col justify-center h-full">
          <Typography variant="body2" fontWeight={600}>{row.title}</Typography>
          {row.parentId !== null && (
            <Typography variant="caption" color="text.secondary">
              Child of: {allFlat.find((c) => c.id === row.parentId)?.title ?? `#${row.parentId}`}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      renderCell: ({ row }) => (
        <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.description ?? '—'}
        </Typography>
      ),
    },
    {
      field: 'scoreWeight',
      headerName: 'Weight',
      width: 90,
      renderCell: ({ row }) => <Typography variant="body2">{row.scoreWeight.toFixed(1)}</Typography>,
    },
    {
      field: 'orderToShow',
      headerName: 'Order',
      width: 70,
    },
    {
      field: 'children',
      headerName: 'Children',
      width: 90,
      renderCell: ({ row }) => (
        <Chip label={row.children.length} size="small" variant="outlined" color={row.children.length > 0 ? 'primary' : 'default'} />
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
      field: 'createdOn',
      headerName: 'Created',
      width: 110,
      renderCell: ({ row }) => new Date(row.createdOn).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: '',
      width: 90,
      sortable: false,
      renderCell: ({ row }) => (
        <Box className="flex items-center h-full">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => { setEditing(row); setDialogOpen(true) }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <Box>
      <Box className="flex items-center justify-between mb-4">
        <Typography variant="h5" fontWeight={700}>Categories</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditing(null); setDialogOpen(true) }}
        >
          New Category
        </Button>
      </Box>

      <Box className="mb-4">
        <TextField
          placeholder="Search categories…"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
          sx={{ minWidth: 280 }}
        />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load categories.</Alert>}

      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={isLoading}
          hideFooter
          rowHeight={60}
          disableColumnMenu
          disableRowSelectionOnClick
        />
      </Box>

      <CategoryDialog
        open={dialogOpen}
        category={editing}
        allCategories={allFlat}
        onClose={closeDialog}
        onSave={handleSave}
        saving={isSaving}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>?
            {(deleteTarget?.children.length ?? 0) > 0 && (
              <> It has <strong>{deleteTarget!.children.length}</strong> child categories that will also be hidden.</>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
