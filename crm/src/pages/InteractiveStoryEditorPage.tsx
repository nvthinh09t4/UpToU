import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, FormControl,
  FormControlLabel, IconButton, InputLabel, MenuItem, Paper, Select,
  Stack, Switch, TextField, Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import FlagIcon from '@mui/icons-material/Flag'
import SaveIcon from '@mui/icons-material/Save'
import StopIcon from '@mui/icons-material/Stop'
import { adminService } from '@/services/adminService'
import type { StoryNode, StoryNodeAnswer } from '@/types'

const ANIMATION_TYPES = ['', 'fade', 'slide-left', 'zoom'] as const

// ── Answer Editor Row ─────────────────────────────────────────────────────────

interface AnswerRowProps {
  answer: StoryNodeAnswer
  nodes: StoryNode[]
  currentNodeId: number
  onSave: (a: StoryNodeAnswer) => void
  onDelete: (id: number) => void
  saving: boolean
}

function AnswerRow({ answer, nodes, currentNodeId, onSave, onDelete, saving }: AnswerRowProps) {
  const [text, setText] = useState(answer.text)
  const [points, setPoints] = useState(answer.pointsAwarded)
  const [nextNodeId, setNextNodeId] = useState<number | ''>(answer.nextNodeId ?? '')
  const [color, setColor] = useState(answer.color ?? '')
  const [sortOrder, setSortOrder] = useState(answer.sortOrder)

  const isDirty =
    text !== answer.text ||
    points !== answer.pointsAwarded ||
    (nextNodeId === '' ? null : nextNodeId) !== answer.nextNodeId ||
    (color || null) !== answer.color ||
    sortOrder !== answer.sortOrder

  return (
    <Box
      sx={{
        display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap',
        p: 1.5, bgcolor: 'background.paper', borderRadius: 1,
        border: '1px solid', borderColor: 'divider',
      }}
    >
      <TextField
        label="Answer Text" value={text} onChange={e => setText(e.target.value)}
        size="small" sx={{ flex: 2, minWidth: 180 }}
      />
      <TextField
        label="Points" type="number" value={points}
        onChange={e => setPoints(Number(e.target.value))}
        size="small" sx={{ width: 80 }} inputProps={{ min: 0 }}
      />
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Next Node</InputLabel>
        <Select
          label="Next Node"
          value={nextNodeId}
          onChange={e => setNextNodeId(e.target.value as number | '')}
        >
          <MenuItem value=""><em>End of Story</em></MenuItem>
          {nodes
            .filter(n => n.id !== currentNodeId)
            .map(n => (
              <MenuItem key={n.id} value={n.id}>
                {n.isStart ? '★ ' : ''}
                {n.question.substring(0, 40)}{n.question.length > 40 ? '…' : ''}
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      <TextField
        label="Color"
        value={color}
        onChange={e => setColor(e.target.value)}
        size="small"
        sx={{ width: 100 }}
        placeholder="#2563eb"
        InputProps={{
          endAdornment: color ? (
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
          ) : null,
        }}
      />
      <TextField
        label="Order" type="number" value={sortOrder}
        onChange={e => setSortOrder(Number(e.target.value))}
        size="small" sx={{ width: 70 }}
      />
      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
        <Tooltip title="Save Answer">
          <span>
            <IconButton
              size="small" color="primary"
              disabled={!isDirty || saving || !text.trim()}
              onClick={() => onSave({
                ...answer, text, pointsAwarded: points,
                nextNodeId: nextNodeId === '' ? null : nextNodeId,
                color: color || null, sortOrder,
              })}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete Answer">
          <IconButton size="small" color="error" disabled={saving} onClick={() => onDelete(answer.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      {nextNodeId === '' && (
        <Chip icon={<StopIcon />} label="Story End" size="small" color="warning" sx={{ alignSelf: 'center' }} />
      )}
    </Box>
  )
}

// ── Node Editor Panel ─────────────────────────────────────────────────────────

interface NodeEditorProps {
  node: StoryNode
  allNodes: StoryNode[]
  detailId: number
  onUpdated: () => void
}

function NodeEditor({ node, allNodes, detailId, onUpdated }: NodeEditorProps) {
  const qc = useQueryClient()
  const [question, setQuestion] = useState(node.question)
  const [subtitle, setSubtitle] = useState(node.questionSubtitle ?? '')
  const [isStart, setIsStart] = useState(node.isStart)
  const [bgImage, setBgImage] = useState(node.backgroundImageUrl ?? '')
  const [bgColor, setBgColor] = useState(node.backgroundColor ?? '')
  const [videoUrl, setVideoUrl] = useState(node.videoUrl ?? '')
  const [animation, setAnimation] = useState<string>(node.animationType ?? '')
  const [sortOrder, setSortOrder] = useState(node.sortOrder)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['story-node-graph', detailId] })
    onUpdated()
  }

  const { mutate: saveNode, isPending: savingNode } = useMutation({
    mutationFn: () => adminService.upsertStoryNode({
      id: node.id, storyDetailId: detailId, question,
      questionSubtitle: subtitle || undefined,
      isStart, backgroundImageUrl: bgImage || undefined,
      backgroundColor: bgColor || undefined,
      videoUrl: videoUrl || undefined,
      animationType: animation || undefined,
      sortOrder,
    }),
    onSuccess: invalidate,
  })

  const { mutate: addAnswer, isPending: addingAnswer } = useMutation({
    mutationFn: () => adminService.upsertStoryNodeAnswer({
      storyNodeId: node.id,
      text: 'New answer',
      pointsAwarded: 0,
      sortOrder: node.answers.length,
    }),
    onSuccess: invalidate,
  })

  const { mutate: saveAnswer, isPending: savingAnswer } = useMutation({
    mutationFn: (a: StoryNodeAnswer) => adminService.upsertStoryNodeAnswer({
      id: a.id, storyNodeId: node.id, text: a.text,
      pointsAwarded: a.pointsAwarded, nextNodeId: a.nextNodeId,
      color: a.color ?? undefined, sortOrder: a.sortOrder,
    }),
    onSuccess: invalidate,
  })

  const { mutate: deleteAnswer } = useMutation({
    mutationFn: (id: number) => adminService.deleteStoryNodeAnswer(id),
    onSuccess: invalidate,
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" fontWeight={700}>Edit Node</Typography>

      <TextField
        label="Question *" value={question} onChange={e => setQuestion(e.target.value)}
        multiline rows={2} fullWidth size="small"
      />
      <TextField
        label="Subtitle" value={subtitle} onChange={e => setSubtitle(e.target.value)}
        fullWidth size="small"
      />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Background Image URL" value={bgImage} onChange={e => setBgImage(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }} size="small"
        />
        <TextField
          label="Background Color" value={bgColor} onChange={e => setBgColor(e.target.value)}
          sx={{ width: 140 }} size="small" placeholder="#0f172a"
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Video URL" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }} size="small" placeholder="YouTube or direct URL"
        />
        <FormControl size="small" sx={{ width: 140 }}>
          <InputLabel>Animation</InputLabel>
          <Select label="Animation" value={animation} onChange={e => setAnimation(e.target.value)}>
            {ANIMATION_TYPES.map(a => <MenuItem key={a} value={a}>{a || 'None'}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          label="Sort Order" type="number" value={sortOrder}
          onChange={e => setSortOrder(Number(e.target.value))}
          sx={{ width: 100 }} size="small"
        />
      </Box>

      <FormControlLabel
        control={<Switch checked={isStart} onChange={e => setIsStart(e.target.checked)} />}
        label="Start Node (entry point of this revision)"
      />

      <Button
        variant="contained" size="small"
        startIcon={savingNode ? <CircularProgress size={16} /> : <SaveIcon />}
        disabled={savingNode || !question.trim()}
        onClick={() => saveNode()}
      >
        Save Node
      </Button>

      <Divider />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2">Answers ({node.answers.length}/5)</Typography>
        <Button
          size="small" startIcon={<AddIcon />}
          disabled={node.answers.length >= 5 || addingAnswer}
          onClick={() => addAnswer()}
        >
          Add Answer
        </Button>
      </Box>

      {node.answers.length < 2 && (
        <Alert severity="warning" sx={{ py: 0.5 }}>Nodes need at least 2 answers.</Alert>
      )}

      <Stack gap={1}>
        {node.answers.map(a => (
          <AnswerRow
            key={a.id}
            answer={a}
            nodes={allNodes}
            currentNodeId={node.id}
            onSave={ans => saveAnswer(ans)}
            onDelete={id => deleteAnswer(id)}
            saving={savingAnswer}
          />
        ))}
      </Stack>
    </Box>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InteractiveStoryEditorPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null)
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null)

  const parsedStoryId = parseInt(storyId ?? '0', 10)

  const { data: details = [], isLoading: detailsLoading, error: detailsError } = useQuery({
    queryKey: ['story-details', parsedStoryId],
    queryFn: () => adminService.getStoryDetails(parsedStoryId).then(r => r.data),
    enabled: parsedStoryId > 0,
  })

  // Default to latest detail (highest revision) once loaded
  const effectiveDetailId = selectedDetailId ?? (details.length > 0
    ? details.reduce((a, b) => (a.revision > b.revision ? a : b)).id
    : null)

  const { data: graph, isLoading: graphLoading, error: graphError } = useQuery({
    queryKey: ['story-node-graph', effectiveDetailId],
    queryFn: () => adminService.getStoryNodeGraph(effectiveDetailId!).then(r => r.data),
    enabled: effectiveDetailId != null,
  })

  const { mutate: addNode, isPending: addingNode } = useMutation({
    mutationFn: () => adminService.upsertStoryNode({
      storyDetailId: effectiveDetailId!,
      question: 'New question',
      isStart: (graph?.nodes.length ?? 0) === 0,
      sortOrder: graph?.nodes.length ?? 0,
    }),
    onSuccess: r => {
      qc.invalidateQueries({ queryKey: ['story-node-graph', effectiveDetailId] })
      setSelectedNodeId(r.data.id)
    },
  })

  const { mutate: deleteNode } = useMutation({
    mutationFn: (id: number) => adminService.deleteStoryNode(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['story-node-graph', effectiveDetailId] })
      setSelectedNodeId(null)
    },
  })

  const selectedNode = graph?.nodes.find(n => n.id === selectedNodeId) ?? null

  if (detailsLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }
  if (detailsError) {
    return <Alert severity="error">Failed to load story details.</Alert>
  }
  if (details.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <IconButton onClick={() => navigate('/stories')}><ArrowBackIcon /></IconButton>
          <Typography variant="h5" fontWeight={700}>Interactive Story Editor</Typography>
        </Box>
        <Alert severity="info">
          This story has no revisions yet. Add a revision on the Stories page before editing nodes.
        </Alert>
      </Box>
    )
  }

  const sortedDetails = [...details].sort((a, b) => b.revision - a.revision)

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate('/stories')}><ArrowBackIcon /></IconButton>
        <Box>
          <Typography variant="h5" fontWeight={700}>Interactive Story Editor</Typography>
          <Typography variant="body2" color="text.secondary">
            Story ID {parsedStoryId}
            {graph && ` · Revision ${graph.revision}`}
            {graph?.effectiveDate && ` · Effective ${new Date(graph.effectiveDate).toLocaleDateString()}`}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Revision</InputLabel>
          <Select
            label="Revision"
            value={effectiveDetailId ?? ''}
            onChange={e => {
              setSelectedDetailId(e.target.value as number)
              setSelectedNodeId(null)
            }}
          >
            {sortedDetails.map(d => (
              <MenuItem key={d.id} value={d.id}>
                rev {d.revision}{d.isPublish ? ' (published)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained" startIcon={<AddIcon />}
          disabled={addingNode || effectiveDetailId == null}
          onClick={() => addNode()}
        >
          Add Node
        </Button>
      </Box>

      {graphError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load node graph.</Alert>}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {/* Node list */}
        <Paper sx={{ width: 280, flexShrink: 0, maxHeight: '75vh', overflowY: 'auto' }}>
          <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {graphLoading ? '…' : `${graph?.nodes.length ?? 0} Nodes`}
            </Typography>
          </Box>

          {graphLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
          ) : !graph || graph.nodes.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary" variant="body2">
                No nodes yet. Add one to get started.
              </Typography>
            </Box>
          ) : (
            graph.nodes.map(node => (
              <Box
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                sx={{
                  p: 1.5, cursor: 'pointer', borderBottom: 1, borderColor: 'divider',
                  bgcolor: selectedNodeId === node.id ? 'primary.light' : 'transparent',
                  '&:hover': {
                    bgcolor: selectedNodeId === node.id ? 'primary.light' : 'action.hover',
                  },
                  display: 'flex', alignItems: 'flex-start', gap: 1,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    {node.isStart && (
                      <Chip
                        icon={<FlagIcon />} label="START" size="small" color="success"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">#{node.id}</Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={selectedNodeId === node.id ? 700 : 400}
                    noWrap
                  >
                    {node.question}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {node.answers.length} answer{node.answers.length !== 1 ? 's' : ''}
                    {node.answers.some(a => a.nextNodeId === null) && ' · has ending'}
                  </Typography>
                </Box>
                <IconButton
                  size="small" color="error"
                  onClick={e => { e.stopPropagation(); deleteNode(node.id) }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))
          )}
        </Paper>

        {/* Node editor */}
        <Paper sx={{ flex: 1, p: 2, maxHeight: '75vh', overflowY: 'auto' }}>
          {selectedNode ? (
            <NodeEditor
              key={selectedNode.id}
              node={selectedNode}
              allNodes={graph?.nodes ?? []}
              detailId={effectiveDetailId!}
              onUpdated={() => { /* invalidation already handled in mutations */ }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', py: 8, textAlign: 'center',
              }}
            >
              <Typography color="text.secondary">Select a node from the list to edit it.</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Or click "Add Node" to create a new one.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  )
}
