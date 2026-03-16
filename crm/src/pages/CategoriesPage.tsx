import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment,
  TextField, Tooltip, Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import { adminService } from '@/services/adminService'
import type { Category } from '@/types'
import { CategoryFormDialog, type CategoryFormData } from '@/components/categories/CategoryFormDialog'

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
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{row.title}</Typography>
          {row.parentId !== null && (
            <Typography variant="caption" color="text.secondary" noWrap>
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
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

      <CategoryFormDialog
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
