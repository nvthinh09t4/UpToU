import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Avatar, Box, Button, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, FormControlLabel, IconButton,
  InputAdornment, InputLabel, MenuItem, Pagination,
  Select, Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import GavelIcon from '@mui/icons-material/Gavel'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PendingIcon from '@mui/icons-material/HourglassEmpty'
import { adminService } from '@/services/adminService'
import { useAuthStore } from '@/store/authStore'
import type { AdminUser, UserBan } from '@/types'

const CRM_ROLES = ['Admin', 'Senior Supervisor', 'Supervisor', 'Contributor']

function initials(u: AdminUser) {
  return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()
}

function hasCrmRole(u: AdminUser) {
  return CRM_ROLES.some((r) => u.roles.includes(r))
}

function roleBadgeProps(role: string): { color: 'default' | 'error' | 'warning' | 'primary' | 'success' | 'info' } {
  switch (role) {
    case 'Admin':            return { color: 'error' }
    case 'Senior Supervisor':return { color: 'warning' }
    case 'Supervisor':       return { color: 'primary' }
    case 'Contributor':      return { color: 'success' }
    default:                 return { color: 'default' }
  }
}

// ── Edit Dialog ───────────────────────────────────────────────────────────────

interface EditDialogProps {
  user: AdminUser | null
  allRoles: string[]
  allowedRoles: string[]
  onClose: () => void
  onSave: (data: Partial<AdminUser> & { roles: string[] }) => void
  saving: boolean
  canEditProfile: boolean
}

function EditDialog({ user, allRoles, allowedRoles, onClose, onSave, saving, canEditProfile }: EditDialogProps) {
  const [firstName, setFirstName]         = useState(user?.firstName ?? '')
  const [lastName, setLastName]           = useState(user?.lastName ?? '')
  const [isActive, setIsActive]           = useState(user?.isActive ?? true)
  const [emailConfirmed, setEmailConfirmed] = useState(user?.emailConfirmed ?? false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles ?? [])

  const toggleRole = (role: string) =>
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )

  // Roles visible in the dialog: assignable roles + roles user already has (read-only display)
  const displayRoles = Array.from(new Set([...allRoles]))

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Edit User
        <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {canEditProfile && (
          <>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth size="small" />
              <TextField label="Last Name"  value={lastName}  onChange={(e) => setLastName(e.target.value)}  fullWidth size="small" />
            </Box>
            <Box sx={{ display: 'flex', gap: 4 }}>
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                label="Active"
              />
              <FormControlLabel
                control={<Switch checked={emailConfirmed} onChange={(e) => setEmailConfirmed(e.target.checked)} />}
                label="Email Confirmed"
              />
            </Box>
            <Divider />
          </>
        )}

        <Box>
          <Typography variant="subtitle2" gutterBottom fontWeight={600}>Roles</Typography>
          {allowedRoles.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              You don't have permission to assign roles.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {displayRoles.map((role) => {
                const isAssignable = allowedRoles.includes(role)
                const isSelected   = selectedRoles.includes(role)
                return (
                  <Chip
                    key={role}
                    label={role}
                    clickable={isAssignable}
                    {...roleBadgeProps(role)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={isAssignable ? () => toggleRole(role) : undefined}
                    sx={{ opacity: isAssignable ? 1 : 0.45, cursor: isAssignable ? 'pointer' : 'default' }}
                  />
                )
              })}
            </Box>
          )}
          {allowedRoles.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Click to toggle. Greyed-out roles are outside your assignment permission.
            </Typography>
          )}
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

// ── Quick Role Assign Dialog ──────────────────────────────────────────────────

interface QuickAssignDialogProps {
  user: AdminUser | null
  allowedRoles: string[]
  onClose: () => void
  onAssign: (roles: string[]) => void
  saving: boolean
}

function QuickAssignDialog({ user, allowedRoles, onClose, onAssign, saving }: QuickAssignDialogProps) {
  const [selectedRole, setSelectedRole] = useState(allowedRoles[0] ?? '')

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Assign Role</DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Assign a CRM role to <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email}).
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            {allowedRoles.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          disabled={saving || !selectedRole}
          onClick={() => onAssign([...(user?.roles ?? []).filter((r) => !CRM_ROLES.includes(r)), selectedRole])}
        >
          {saving ? <CircularProgress size={20} /> : 'Assign'}
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
  const [banType, setBanType]       = useState('Global')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [reason, setReason]         = useState('')
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
          <Select label="Ban Type" value={banType} onChange={(e) => setBanType(e.target.value)}>
            <MenuItem value="Global">Global Ban</MenuItem>
            <MenuItem value="Category">Category Restriction</MenuItem>
          </Select>
        </FormControl>
        {banType === 'Category' && (
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value as number)}>
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
          multiline rows={3} fullWidth required size="small"
        />
        <TextField
          label="Duration (days) — leave empty for permanent"
          type="number"
          value={durationDays}
          onChange={(e) => setDurationDays(e.target.value === '' ? '' : Number(e.target.value))}
          inputProps={{ min: 1 }} fullWidth size="small"
          helperText={durationDays === '' ? 'Permanent ban' : `Expires in ${durationDays} day(s)`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained" color="error"
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

interface BanHistoryDialogProps { user: AdminUser | null; onClose: () => void }

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
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
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
                      size="small" color={ban.banType === 'Global' ? 'error' : 'warning'}
                    />
                    <Chip
                      label={ban.isActive ? 'Active' : 'Revoked / Expired'}
                      size="small" color={ban.isActive ? 'error' : 'default'} variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>{ban.reason}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Issued by {ban.issuedByName} · {new Date(ban.issuedAt).toLocaleString()}
                    {ban.expiresAt ? ` · Expires ${new Date(ban.expiresAt).toLocaleString()}` : ' · Permanent'}
                    {ban.revokedAt && ` · Revoked ${new Date(ban.revokedAt).toLocaleString()}`}
                  </Typography>
                </Box>
                {ban.isActive && (
                  <Tooltip title="Revoke Ban">
                    <IconButton size="small" color="success" disabled={revoking} onClick={() => revoke(ban.id)}>
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
  const isAdmin          = useAuthStore((s) => s.isAdmin)
  const assignableRoles  = useAuthStore((s) => s.assignableRoles)
  const [page, setPage]  = useState(1)
  const [pageSize]       = useState(10)
  const [search, setSearch]           = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter]   = useState('')
  const [editUser, setEditUser]               = useState<AdminUser | null>(null)
  const [quickAssignUser, setQuickAssignUser] = useState<AdminUser | null>(null)
  const [deleteConfirm, setDeleteConfirm]     = useState<AdminUser | null>(null)
  const [banUser, setBanUser]                 = useState<AdminUser | null>(null)
  const [banHistoryUser, setBanHistoryUser]   = useState<AdminUser | null>(null)

  const canBanDelete = isAdmin()
  const myAssignableRoles = assignableRoles()

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, pageSize, search, roleFilter],
    queryFn: () =>
      adminService.getUsers({
        page, pageSize,
        search: search || undefined,
        role: (roleFilter && roleFilter !== '__pending') ? roleFilter : undefined,
      }).then((r) => r.data),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setEditUser(null)
      setQuickAssignUser(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeleteConfirm(null) },
  })

  const banMutation = useMutation({
    mutationFn: (payload: Parameters<typeof adminService.banUser>[0]) => adminService.banUser(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setBanUser(null) },
  })

  // Users without any CRM role — need role assignment
  const pendingUsers = (data?.items ?? []).filter((u) => !hasCrmRole(u))
  // All users shown in the main grid (filter frontend-side for __pending special filter)
  const gridRows = roleFilter === '__pending'
    ? pendingUsers
    : (data?.items ?? [])

  const columns: GridColDef<AdminUser>[] = [
    {
      field: 'name', headerName: 'User', flex: 1.5,
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
      field: 'roles', headerName: 'Roles', flex: 1,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
          {row.roles.filter((r) => CRM_ROLES.includes(r)).length === 0 ? (
            <Chip label="No CRM Role" size="small" color="warning" variant="outlined" icon={<PendingIcon sx={{ fontSize: '14px !important' }} />} />
          ) : (
            row.roles.filter((r) => CRM_ROLES.includes(r)).map((r) => (
              <Chip key={r} label={r} size="small" {...roleBadgeProps(r)} variant="outlined" />
            ))
          )}
        </Box>
      ),
    },
    {
      field: 'isActive', headerName: 'Status', width: 100,
      renderCell: ({ row }) => (
        <Chip label={row.isActive ? 'Active' : 'Inactive'} size="small" color={row.isActive ? 'success' : 'default'} />
      ),
    },
    {
      field: 'lastLoginAt', headerName: 'Last Login', flex: 1,
      renderCell: ({ row }) =>
        row.lastLoginAt
          ? new Date(row.lastLoginAt).toLocaleString()
          : <Typography color="text.disabled" variant="body2">Never</Typography>,
    },
    {
      field: 'createdAt', headerName: 'Registered', flex: 1,
      renderCell: ({ row }) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      field: 'actions', headerName: '', width: 150, sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {myAssignableRoles.length > 0 && !hasCrmRole(row) && (
            <Tooltip title="Assign Role">
              <IconButton size="small" color="primary" onClick={() => setQuickAssignUser(row)}>
                <PersonAddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => setEditUser(row)}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          {canBanDelete && (
            <>
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
            </>
          )}
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Users</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user accounts and CRM role assignments.
          </Typography>
        </Box>
      </Box>

      {/* Pending Assignment Banner */}
      {pendingUsers.length > 0 && !roleFilter && !search && (
        <Box sx={{
          mb: 3, p: 2, borderRadius: 2, border: '1px solid',
          borderColor: 'warning.light', bgcolor: 'warning.50',
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <PendingIcon color="warning" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {pendingUsers.length} user{pendingUsers.length > 1 ? 's' : ''} awaiting role assignment
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {pendingUsers.map((u) => `${u.firstName} ${u.lastName}`).join(', ')}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Role Hierarchy Legend */}
      <Box sx={{ mb: 2.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>Role hierarchy:</Typography>
        {[
          { role: 'Admin',            desc: 'Full platform management' },
          { role: 'Senior Supervisor',desc: 'Assigns supervisors, approves stories' },
          { role: 'Supervisor',       desc: 'Reviews and approves stories' },
          { role: 'Contributor',      desc: 'Creates and submits stories' },
        ].map(({ role, desc }) => (
          <Tooltip key={role} title={desc}>
            <Chip label={role} size="small" {...roleBadgeProps(role)} variant="outlined" />
          </Tooltip>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
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
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All Roles</MenuItem>
          <MenuItem value="__pending">Pending Assignment</MenuItem>
          {roles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </Select>
        {(search || roleFilter) && (
          <Button size="small" onClick={() => { setSearch(''); setSearchInput(''); setRoleFilter(''); setPage(1) }}>
            Clear
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>Failed to load users.</Alert>}

      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={gridRows}
          columns={columns}
          loading={isLoading}
          hideFooter
          rowHeight={64}
          disableColumnMenu
          disableRowSelectionOnClick
          getRowClassName={(params) => !hasCrmRole(params.row) ? 'row-pending' : ''}
          sx={{
            '& .row-pending': { bgcolor: 'warning.50', '&:hover': { bgcolor: 'warning.100' } },
          }}
        />
      </Box>

      {data && data.totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Pagination count={data.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Stack>
      )}

      {/* Edit dialog */}
      <EditDialog
        user={editUser}
        allRoles={roles}
        allowedRoles={myAssignableRoles}
        onClose={() => setEditUser(null)}
        saving={updateMutation.isPending}
        canEditProfile={isAdmin()}
        onSave={(d) => editUser && updateMutation.mutate({ id: editUser.id, data: d as Parameters<typeof adminService.updateUser>[1] })}
      />

      {/* Quick assign dialog */}
      <QuickAssignDialog
        user={quickAssignUser}
        allowedRoles={myAssignableRoles}
        onClose={() => setQuickAssignUser(null)}
        saving={updateMutation.isPending}
        onAssign={(roles) =>
          quickAssignUser && updateMutation.mutate({
            id: quickAssignUser.id,
            data: { firstName: quickAssignUser.firstName, lastName: quickAssignUser.lastName,
                    isActive: quickAssignUser.isActive, emailConfirmed: quickAssignUser.emailConfirmed, roles },
          })
        }
      />

      {/* Ban dialog */}
      {canBanDelete && (
        <BanDialog
          user={banUser}
          categories={allCategories}
          onClose={() => setBanUser(null)}
          saving={banMutation.isPending}
          onBan={(d) => banUser && banMutation.mutate({ userId: banUser.id, ...d })}
        />
      )}

      {/* Ban history dialog */}
      {canBanDelete && (
        <BanHistoryDialog user={banHistoryUser} onClose={() => setBanHistoryUser(null)} />
      )}

      {/* Delete confirm */}
      {canBanDelete && (
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
              color="error" variant="contained"
              disabled={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
            >
              {deleteMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  )
}
