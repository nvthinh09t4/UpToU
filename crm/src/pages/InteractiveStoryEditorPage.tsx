import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, CircularProgress, Chip, Divider, FormControl, IconButton,
  InputLabel, MenuItem, Paper, Select, Tooltip, Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import { adminService } from '@/services/adminService'
import StoryFlowGraph from '@/components/stories/graph/StoryFlowGraph'
import NodeEditPanel from '@/components/stories/NodeEditPanel'

export default function InteractiveStoryEditorPage() {
  const { storyId }   = useParams<{ storyId: string }>()
  const navigate      = useNavigate()
  const qc            = useQueryClient()
  const parsedStoryId = parseInt(storyId ?? '0', 10)

  const [selectedNodeId,   setSelectedNodeId]   = useState<number | null>(null)
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null)

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: details = [], isLoading: detailsLoading, error: detailsError } = useQuery({
    queryKey: ['story-details', parsedStoryId],
    queryFn:  () => adminService.getStoryDetails(parsedStoryId).then(r => r.data),
    enabled:  parsedStoryId > 0,
  })

  const effectiveDetailId = selectedDetailId ??
    (details.length > 0 ? details.reduce((a, b) => a.revision > b.revision ? a : b).id : null)

  const { data: graph, isLoading: graphLoading, error: graphError } = useQuery({
    queryKey: ['story-node-graph', effectiveDetailId],
    queryFn:  () => adminService.getStoryNodeGraph(effectiveDetailId!).then(r => r.data),
    enabled:  effectiveDetailId != null,
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const { mutate: addNode, isPending: addingNode } = useMutation({
    mutationFn: () => adminService.upsertStoryNode({
      storyDetailId: effectiveDetailId!,
      question:  'New question',
      isStart:   (graph?.nodes.length ?? 0) === 0,
      sortOrder: graph?.nodes.length ?? 0,
    }),
    onSuccess: r => {
      qc.invalidateQueries({ queryKey: ['story-node-graph', effectiveDetailId] })
      setSelectedNodeId(r.data.id)
    },
  })

  const { mutate: deleteNode } = useMutation({
    mutationFn: (id: number) => adminService.deleteStoryNode(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['story-node-graph', effectiveDetailId] })
      setSelectedNodeId(null)
    },
  })

  // ── Loading / error states ─────────────────────────────────────────────────

  if (detailsLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }
  if (detailsError) return <Alert severity="error">Failed to load story details.</Alert>
  if (details.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton onClick={() => navigate('/stories')}><ArrowBackIcon /></IconButton>
          <Typography variant="h5" fontWeight={700}>Interactive Story Editor</Typography>
        </Box>
        <Alert severity="info">
          No revisions yet. Add a revision on the Stories page first.
        </Alert>
      </Box>
    )
  }

  const sortedDetails  = [...details].sort((a, b) => b.revision - a.revision)
  const selectedNode   = graph?.nodes.find(n => n.id === selectedNodeId) ?? null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexShrink: 0 }}>
        <IconButton onClick={() => navigate('/stories')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            Interactive Story Editor
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Story #{parsedStoryId}
            {graph && ` · Revision ${graph.revision}`}
            {graph?.effectiveDate && ` · Effective ${new Date(graph.effectiveDate).toLocaleDateString()}`}
          </Typography>
        </Box>

        {/* Revision picker */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Revision</InputLabel>
          <Select
            label="Revision"
            value={effectiveDetailId ?? ''}
            onChange={e => { setSelectedDetailId(e.target.value as number); setSelectedNodeId(null) }}
          >
            {sortedDetails.map(d => (
              <MenuItem key={d.id} value={d.id}>
                rev {d.revision}
                {d.isPublish && <Chip label="live" size="small" color="success" sx={{ ml: 1, height: 16, fontSize: 10 }} />}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Node count badge */}
        {graph && (
          <Chip
            label={`${graph.nodes.length} node${graph.nodes.length !== 1 ? 's' : ''}`}
            size="small" variant="outlined" color="primary"
          />
        )}

        {graphLoading && <CircularProgress size={18} />}
      </Box>

      {graphError && <Alert severity="error" sx={{ mb: 1 }}>Failed to load node graph.</Alert>}

      <Divider sx={{ mb: 1.5, flexShrink: 0 }} />

      {/* ── Canvas + edit panel ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', gap: 1.5 }}>

        {/* Flow graph */}
        <StoryFlowGraph
          storyNodes={graph?.nodes ?? []}
          selectedNodeId={selectedNodeId}
          detailId={effectiveDetailId ?? 0}
          onSelectNode={setSelectedNodeId}
          onDeleteNode={deleteNode}
          onAddNode={() => addNode()}
          addingNode={addingNode}
        />

        {/* Node edit panel — slides in when a node is selected */}
        {selectedNode && (
          <Paper
            elevation={4}
            sx={{
              width: 400, flexShrink: 0, overflowY: 'auto', p: 2,
              borderRadius: 2, display: 'flex', flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
                Node #{selectedNode.id}
              </Typography>
              <Tooltip title="Close panel">
                <IconButton size="small" onClick={() => setSelectedNodeId(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <NodeEditPanel
              key={selectedNode.id}
              node={selectedNode}
              allNodes={graph?.nodes ?? []}
              detailId={effectiveDetailId!}
            />
          </Paper>
        )}
      </Box>
    </Box>
  )
}
