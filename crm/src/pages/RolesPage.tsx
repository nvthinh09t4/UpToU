import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider,
  IconButton, List, ListItem, ListItemText, Paper,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import { adminService } from '@/services/adminService'

const PROTECTED_ROLES = ['Admin', 'User', 'Senior Supervisor', 'Supervisor', 'Contributor']
const SYSTEM_ROLES    = ['Admin', 'Senior Supervisor', 'Supervisor', 'Contributor', 'User']

type RoleInfo = {
  name: string
  label: string
  color: 'error' | 'warning' | 'primary' | 'success' | 'default'
  description: string
  isSystem: boolean
}

const ROLE_INFO: RoleInfo[] = [
  {
    name: 'Admin',
    label: 'Admin',
    color: 'error',
    description: 'Sole administrator. Manages platform settings, users, categories, rewards, and jobs. Does NOT approve or reject stories.',
    isSystem: true,
  },
  {
    name: 'Senior Supervisor',
    label: 'Senior Supervisor',
    color: 'warning',
    description: 'Manages Supervisors and Contributors. Can approve and reject stories. Assigns the Supervisor and Contributor roles to users.',
    isSystem: true,
  },
  {
    name: 'Supervisor',
    label: 'Supervisor',
    color: 'primary',
    description: 'Reviews and approves or rejects submitted stories. Can be assigned by a Senior Supervisor to review specific stories.',
    isSystem: true,
  },
  {
    name: 'Contributor',
    label: 'Contributor',
    color: 'success',
    description: 'Creates and submits stories for review. Can optionally assign a specific Supervisor to review their story.',
    isSystem: true,
  },
  {
    name: 'User',
    label: 'User (Client)',
    color: 'default',
    description: 'Registered on the client site. Has no CRM access unless also assigned a CRM role.',
    isSystem: true,
  },
]

type Permission = {
  action: string
  admin: boolean
  seniorSupervisor: boolean
  supervisor: boolean
  contributor: boolean
}

const PERMISSIONS: Permission[] = [
  { action: 'View Dashboard',           admin: true,  seniorSupervisor: true,  supervisor: true,  contributor: true  },
  { action: 'View Users',               admin: true,  seniorSupervisor: true,  supervisor: false, contributor: false },
  { action: 'Assign Supervisor role',   admin: true,  seniorSupervisor: true,  supervisor: false, contributor: false },
  { action: 'Assign Contributor role',  admin: true,  seniorSupervisor: true,  supervisor: false, contributor: false },
  { action: 'Assign Admin / Sr. Sup.', admin: true,  seniorSupervisor: false, supervisor: false, contributor: false },
  { action: 'Delete Users',             admin: true,  seniorSupervisor: false, supervisor: false, contributor: false },
  { action: 'Ban Users',                admin: true,  seniorSupervisor: false, supervisor: false, contributor: false },
  { action: 'Manage Roles',             admin: true,  seniorSupervisor: false, supervisor: false, contributor: false },
  { action: 'Manage Categories',        admin: true,  seniorSupervisor: true,  supervisor: true,  contributor: false },
  { action: 'Create / Edit Stories',    admin: true,  seniorSupervisor: true,  supervisor: true,  contributor: true  },
  { action: 'Delete Stories',           admin: true,  seniorSupervisor: true,  supervisor: true,  contributor: false },
  { action: 'Submit Story for Review',  admin: true,  seniorSupervisor: true,  supervisor: true,  contributor: true  },
  { action: 'Approve Stories',          admin: false, seniorSupervisor: true,  supervisor: true,  contributor: false },
  { action: 'Reject Stories',           admin: false, seniorSupervisor: true,  supervisor: true,  contributor: false },
  { action: 'View Reports',             admin: true,  seniorSupervisor: true,  supervisor: false, contributor: false },
  { action: 'Manage Rewards',           admin: true,  seniorSupervisor: false, supervisor: false, contributor: false },
  { action: 'Manage Jobs',              admin: true,  seniorSupervisor: false, supervisor: false, contributor: false },
]

function PermIcon({ allowed }: { allowed: boolean }) {
  return allowed
    ? <CheckIcon fontSize="small" sx={{ color: 'success.main' }} />
    : <CloseIcon fontSize="small" sx={{ color: 'text.disabled' }} />
}

export default function RolesPage() {
  const qc = useQueryClient()
  const [newRole, setNewRole]           = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [createError, setCreateError]   = useState<string | null>(null)

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

  const customRoles = roles.filter((r) => !SYSTEM_ROLES.includes(r))

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Roles & Permissions</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        System roles define access levels. Custom roles can be created for special purposes.
      </Typography>

      {/* System roles overview */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>System Roles</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
        {ROLE_INFO.map((info) => (
          <Paper key={info.name} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Chip
                label={info.label}
                color={info.color}
                size="small"
                sx={{ mt: 0.25, minWidth: 130, justifyContent: 'center', flexShrink: 0 }}
              />
              <Box>
                <Typography variant="body2">{info.description}</Typography>
              </Box>
              <Chip label="System" size="small" variant="outlined" sx={{ ml: 'auto', flexShrink: 0 }} />
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Permissions matrix */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Permissions Matrix</Typography>
      <Paper variant="outlined" sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Permission</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                <Chip label="Admin" color="error" size="small" />
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, minWidth: 110 }}>
                <Chip label="Sr. Supervisor" color="warning" size="small" />
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                <Chip label="Supervisor" color="primary" size="small" />
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                <Chip label="Contributor" color="success" size="small" />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PERMISSIONS.map((p, i) => (
              <TableRow key={p.action} sx={{ bgcolor: i % 2 === 0 ? 'transparent' : 'grey.50' }}>
                <TableCell>{p.action}</TableCell>
                <TableCell align="center"><PermIcon allowed={p.admin} /></TableCell>
                <TableCell align="center"><PermIcon allowed={p.seniorSupervisor} /></TableCell>
                <TableCell align="center"><PermIcon allowed={p.supervisor} /></TableCell>
                <TableCell align="center"><PermIcon allowed={p.contributor} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Custom roles */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Custom Roles</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Custom roles can be created for tagging purposes. They do not grant CRM access on their own.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, maxWidth: 480 }}>
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
      ) : customRoles.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, maxWidth: 480 }}>
          <Typography variant="body2" color="text.secondary">No custom roles yet.</Typography>
        </Paper>
      ) : (
        <List sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, maxWidth: 480 }}>
          {customRoles.map((role, i) => (
            <ListItem
              key={role}
              divider={i < customRoles.length - 1}
              secondaryAction={
                <Tooltip title="Delete role">
                  <IconButton edge="end" color="error" onClick={() => setDeleteConfirm(role)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemText
                primary={role}
                primaryTypographyProps={{ fontWeight: 600 }}
                secondary="Custom role"
              />
            </ListItem>
          ))}
        </List>
      )}

      <Divider sx={{ my: 3, maxWidth: 480 }} />

      {/* All system roles (read-only) */}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>All system roles (read-only)</Typography>
      <List sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, maxWidth: 480 }}>
        {SYSTEM_ROLES.filter((r) => roles.includes(r)).map((role, i) => (
          <ListItem key={role} divider={i < SYSTEM_ROLES.length - 1} secondaryAction={<Chip label="System" size="small" />}>
            <ListItemText primary={role} primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItem>
        ))}
      </List>

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
            color="error" variant="contained"
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
