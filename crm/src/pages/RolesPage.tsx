import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, IconButton,
  List, ListItem, ListItemText, TextField, Tooltip, Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { adminService } from '@/services/adminService'

const PROTECTED_ROLES = ['Admin', 'User']

export default function RolesPage() {
  const qc = useQueryClient()
  const [newRole, setNewRole] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => adminService.getRoles().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => adminService.createRole(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setNewRole(''); setCreateError(null) },
    onError: (err: { response?: { data?: { title?: string } } }) => {
      setCreateError(err.response?.data?.title ?? 'Failed to create role.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (name: string) => adminService.deleteRole(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setDeleteConfirm(null) },
  })

  const handleCreate = () => {
    const trimmed = newRole.trim()
    if (!trimmed) return
    createMutation.mutate(trimmed)
  }

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>Roles</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage user roles. Built-in roles (Admin, User) cannot be deleted.
      </Typography>

      {/* Create new role */}
      <Box className="flex gap-2 mb-4">
        <TextField
          size="small"
          label="New role name"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          error={!!createError}
          helperText={createError ?? undefined}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          disabled={createMutation.isPending || !newRole.trim()}
        >
          {createMutation.isPending ? <CircularProgress size={20} /> : 'Create'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load roles.</Alert>}

      {isLoading ? (
        <CircularProgress />
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          {roles.map((role, i) => (
            <ListItem
              key={role}
              divider={i < roles.length - 1}
              secondaryAction={
                PROTECTED_ROLES.includes(role) ? (
                  <Chip label="Built-in" size="small" />
                ) : (
                  <Tooltip title="Delete role">
                    <IconButton edge="end" color="error" onClick={() => setDeleteConfirm(role)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              <ListItemText
                primary={role}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>
            Delete role <strong>{deleteConfirm}</strong>? Users assigned this role will lose it.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
