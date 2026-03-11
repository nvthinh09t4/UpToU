import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Avatar, Box, Button, Checkbox, Chip,
  CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, IconButton, InputAdornment,
  MenuItem, Pagination, Select, Stack, Switch, TextField,
  Tooltip, Typography, Divider, FormControl, InputLabel,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import GavelIcon from '@mui/icons-material/Gavel'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import { adminService } from '@/services/adminService'
import type { AdminUser, UserBan } from '@/types'

function initials(u: AdminUser) {
  return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

interface EditDialogProps {
  user: AdminUser | null
  roles: string[]
  onClose: () => void
  onSave: (data: Partial<AdminUser> & { roles: string[] }) => void
  saving: boolean
}

function EditDialog({ user, roles, onClose, onSave, saving }: EditDialogProps) {
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [emailConfirmed, setEmailConfirmed] = useState(user?.emailConfirmed ?? false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles ?? [])

  const toggleRole = (role: string) =>
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User — {user?.email}</DialogTitle>
      <DialogContent className="flex flex-col gap-4 pt-4!">
        <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
        <TextField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
        <Box className="flex gap-6">
          <FormControlLabel
            control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label="Active"
          />
          <FormControlLabel
            control={<Switch checked={emailConfirmed} onChange={(e) => setEmailConfirmed(e.target.checked)} />}
            label="Email Confirmed"
          />
        </Box>
        <Box>
          <Typography variant="subtitle2" gutterBottom>Roles</Typography>
          <Box className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <Chip
                key={role}
                label={role}
                clickable
                color={selectedRoles.includes(role) ? 'primary' : 'default'}
                onClick={() => toggleRole(role)}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          disabled={saving}
          onClick={() => onSave({ firstName, lastName, isActive, emailConfirmed, roles: selectedRoles })}
        >
          {saving ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Ban Dialog ────────────────────────────────────────────────────────────────

interface BanDialogProps {
  user: AdminUser | null
  categories: { id: number; title: string }[]
  onClose: () => void
  onBan: (data: { banType: string; categoryId?: number; reason: string; durationDays?: number }) => void
  saving: boolean
}

function BanDialog({ user, categories, onClose, onBan, saving }: BanDialogProps) {
  const [banType, setBanType] = useState('Global')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [reason, setReason] = useState('')
  const [durationDays, setDurationDays] = useState<number | ''>('')

  function handleSubmit() {
    if (!reason.trim()) return
    onBan({
      banType,
      categoryId: banType === 'Category' && categoryId !== '' ? Number(categoryId) : undefined,
      reason: reason.trim(),
      durationDays: durationDays !== '' ? Number(durationDays) : undefined,
    })
  }

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ban / Restrict — {user?.email}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <FormControl fullWidth size="small">
          <InputLabel>Ban Type</InputLabel>
          <Select
            label="Ban Type"
            value={banType}
            onChange={(e) => setBanType(e.target.value)}
          >
            <MenuItem value="Global">Global Ban</MenuItem>
            <MenuItem value="Category">Category Restriction</MenuItem>
          </Select>
        </FormControl>

        {banType === 'Category' && (
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as number)}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <TextField
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={3}
          fullWidth
          required
          size="small"
        />

        <TextField
          label="Duration (days) — leave empty for permanent"
          type="number"
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value === '' ? '' : Number(e.target.value))}
          inputProps={{ min: 1 }}
          fullWidth
          size="small"
          helperText={durationDays === '' ? 'Permanent ban' : `Expires in ${durationDays} day(s)`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          disabled={saving || !reason.trim() || (banType === 'Category' && categoryId === '')}
          onClick={handleSubmit}
        >
          {saving ? <CircularProgress size={20} /> : 'Ban User'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Ban History Dialog ────────────────────────────────────────────────────────

interface BanHistoryDialogProps {
  user: AdminUser | null
  onClose: () => void
}

function BanHistoryDialog({ user, onClose }: BanHistoryDialogProps) {
  const qc = useQueryClient()

  const { data: bans = [], isLoading } = useQuery({
    queryKey: ['user-bans', user?.id],
    queryFn: () => adminService.getBans(user!.id).then((r) => r.data),
    enabled: !!user,
  })

  const { mutate: revoke, isPending: revoking } = useMutation({
    mutationFn: (banId: number) => adminService.revokeBan(banId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-bans'] }),
  })

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Ban History — {user?.email}</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : bans.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>No bans found for this user.</Typography>
        ) : (
          bans.map((ban: UserBan, i: number) => (
            <Box key={ban.id}>
              {i > 0 && <Divider sx={{ my: 1.5 }} />}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip
                      label={ban.banType === 'Global' ? 'Global Ban' : `Restricted: ${ban.categoryTitle}`}
                      size="small"
                      color={ban.banType === 'Global' ? 'error' : 'warning'}
                    />
                    <Chip
                      label={ban.isActive ? 'Active' : 'Revoked / Expired'}
                      size="small"
                      color={ban.isActive ? 'error' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>{ban.reason}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Issued by {ban.issuedByName} · {new Date(ban.issuedAt).toLocaleString()}
                    {ban.expiresAt
                      ? ` · Expires ${new Date(ban.expiresAt).toLocaleString()}`
                      : ' · Permanent'}
                    {ban.revokedAt && ` · Revoked ${new Date(ban.revokedAt).toLocaleString()}`}
                  </Typography>
                </Box>
                {ban.isActive && (
                  <Tooltip title="Revoke Ban">
                    <IconButton
                      size="small"
                      color="success"
                      disabled={revoking}
                      onClick={() => revoke(ban.id)}
                    >
                      <LockOpenIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null)
  const [banUser, setBanUser] = useState<AdminUser | null>(null)
  const [banHistoryUser, setBanHistoryUser] = useState<AdminUser | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, pageSize, search, roleFilter],
    queryFn: () =>
      adminService
        .getUsers({ page, pageSize, search: search || undefined, role: roleFilter || undefined })
        .then((r) => r.data),
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => adminService.getRoles().then((r) => r.data),
  })

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => adminService.getCategories().then((r) => r.data.map((c) => ({ id: c.id, title: c.title }))),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof adminService.updateUser>[1] }) =>
      adminService.updateUser(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setEditUser(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeleteConfirm(null) },
  })

  const banMutation = useMutation({
    mutationFn: (payload: Parameters<typeof adminService.banUser>[0]) =>
      adminService.banUser(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setBanUser(null) },
  })

  const columns: GridColDef<AdminUser>[] = [
    {
      field: 'name',
      headerName: 'User',
      flex: 1.5,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: 12 }}>{initials(row)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{row.firstName} {row.lastName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{row.email}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'roles',
      headerName: 'Roles',
      flex: 1,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
          {row.roles.map((r) => <Chip key={r} label={r} size="small" color="primary" variant="outlined" />)}
        </Box>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: ({ row }) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={row.isActive ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'emailConfirmed',
      headerName: 'Verified',
      width: 90,
      renderCell: ({ row }) => (
        <Checkbox checked={row.emailConfirmed} disabled size="small" />
      ),
    },
    {
      field: 'lastLoginAt',
      headerName: 'Last Login',
      flex: 1,
      renderCell: ({ row }) =>
        row.lastLoginAt
          ? new Date(row.lastLoginAt).toLocaleString()
          : <Typography color="text.disabled" variant="body2">Never</Typography>,
    },
    {
      field: 'createdAt',
      headerName: 'Registered',
      flex: 1,
      renderCell: ({ row }) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: '',
      width: 130,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => setEditUser(row)}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Ban / Restrict">
            <IconButton size="small" color="warning" onClick={() => setBanUser(row)}>
              <GavelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ban History">
            <IconButton size="small" onClick={() => setBanHistoryUser(row)}>
              <LockOpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteConfirm(row)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Users</Typography>

      {/* Filters */}
      <Box className="flex gap-3 mb-4 flex-wrap">
        <TextField
          placeholder="Search by name or email…"
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <Button size="small" onClick={() => { setSearch(searchInput); setPage(1) }}>Search</Button>
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 280 }}
        />
        <Select
          size="small"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          displayEmpty
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Roles</MenuItem>
          {roles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </Select>
        {(search || roleFilter) && (
          <Button size="small" onClick={() => { setSearch(''); setSearchInput(''); setRoleFilter(''); setPage(1) }}>
            Clear
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load users.</Alert>}

      <Box sx={{ height: 520, width: '100%' }}>
        <DataGrid
          rows={data?.items ?? []}
          columns={columns}
          loading={isLoading}
          hideFooter
          rowHeight={64}
          disableColumnMenu
          disableRowSelectionOnClick
        />
      </Box>

      {data && data.totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination
            count={data.totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
          />
        </Stack>
      )}

      {/* Edit dialog */}
      <EditDialog
        user={editUser}
        roles={roles}
        onClose={() => setEditUser(null)}
        saving={updateMutation.isPending}
        onSave={(d) => editUser && updateMutation.mutate({ id: editUser.id, data: d as Parameters<typeof adminService.updateUser>[1] })}
      />

      {/* Ban dialog */}
      <BanDialog
        user={banUser}
        categories={allCategories}
        onClose={() => setBanUser(null)}
        saving={banMutation.isPending}
        onBan={(d) => banUser && banMutation.mutate({ userId: banUser.id, ...d })}
      />

      {/* Ban history dialog */}
      <BanHistoryDialog
        user={banHistoryUser}
        onClose={() => setBanHistoryUser(null)}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteConfirm?.email}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
