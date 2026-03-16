import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Chip, CircularProgress, Collapse, Divider, FormControl,
  FormControlLabel, IconButton, InputLabel, MenuItem, Select,
  Stack, Switch, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ImageIcon from '@mui/icons-material/Image'
import { Stop as StopIcon } from '@mui/icons-material'
import { adminService } from '@/services/adminService'
import type { StoryNode, StoryNodeAnswer } from '@/types'
import NodePreviewDialog from './NodePreviewDialog'

const ANIMATION_TYPES = ['', 'fade', 'slide-left', 'zoom'] as const

// ── Language tab panel helper ─────────────────────────────────────────────────

function LangTab({ value, index, children }: { value: number; index: number; children: React.ReactNode }) {
  return value === index ? <>{children}</> : null
}

// ── Answer Row ────────────────────────────────────────────────────────────────

interface AnswerRowProps {
  answer: StoryNodeAnswer
  index: number
  nodes: StoryNode[]
  currentNodeId: number
  onSave: (a: StoryNodeAnswer) => void
  onDelete: (id: number) => void
  saving: boolean
}

function AnswerRow({ answer, index, nodes, currentNodeId, onSave, onDelete, saving }: AnswerRowProps) {
  const [lang,       setLang]       = useState(0)
  const [text,       setText]       = useState(answer.text)
  const [textVi,     setTextVi]     = useState(answer.textVi ?? '')
  const [feedback,   setFeedback]   = useState(answer.feedback ?? '')
  const [feedbackVi, setFeedbackVi] = useState(answer.feedbackVi ?? '')
  const [points,     setPoints]     = useState(answer.pointsAwarded)
  const [nextId,     setNextId]     = useState<number | ''>(answer.nextNodeId ?? '')
  const [color,      setColor]      = useState(answer.color ?? '')
  const [sortOrder,  setSortOrder]  = useState(answer.sortOrder)

  const isTerminal = nextId === ''

  const isDirty =
    text !== answer.text || textVi !== (answer.textVi ?? '') ||
    points !== answer.pointsAwarded ||
    (nextId === '' ? null : nextId) !== answer.nextNodeId ||
    (color || null) !== answer.color ||
    (feedback || null) !== (answer.feedback ?? null) ||
    (feedbackVi || null) !== (answer.feedbackVi ?? null) ||
    sortOrder !== answer.sortOrder

  const accentColor = color || '#6b7280'

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: isTerminal ? 'warning.dark' : 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      {/* ── Card header ────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 1.5, py: 0.75,
          bgcolor: isTerminal ? 'rgba(234,179,8,0.08)' : 'action.hover',
          display: 'flex', alignItems: 'center', gap: 1,
          borderBottom: '1px solid', borderColor: isTerminal ? 'warning.dark' : 'divider',
        }}
      >
        <Box
          sx={{
            width: 20, height: 20, borderRadius: '50%', bgcolor: accentColor,
            border: '2px solid', borderColor: 'background.default', flexShrink: 0,
            fontSize: 10, color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700,
          }}
        >
          {index + 1}
        </Box>
        <Typography
          variant="body2"
          sx={{ flex: 1, fontWeight: 500, color: 'text.primary',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {text || <em style={{ opacity: 0.5 }}>No text yet</em>}
        </Typography>
        {isTerminal && (
          <Chip
            icon={<StopIcon sx={{ fontSize: '14px !important' }} />}
            label="Ends story"
            size="small"
            sx={{
              height: 20, fontSize: 10, bgcolor: 'rgba(234,179,8,0.15)',
              color: 'warning.light', border: '1px solid', borderColor: 'warning.dark',
              '& .MuiChip-icon': { color: 'warning.light' },
            }}
          />
        )}
        {isDirty && (
          <Chip label="unsaved" size="small"
            sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(59,130,246,0.15)',
              color: 'primary.light', border: '1px solid rgba(59,130,246,0.3)' }} />
        )}
        <Tooltip title="Delete answer">
          <IconButton size="small" color="error" disabled={saving} onClick={() => onDelete(answer.id)}
            sx={{ p: 0.4 }}>
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Card body ──────────────────────────────────────────────────────── */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>

        {/* Language tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={lang} onChange={(_, v) => setLang(v)} sx={{ minHeight: 32 }}
            slotProps={{ indicator: { style: { height: 2 } } }}>
            <Tab label="English" sx={{ minHeight: 32, py: 0, fontSize: 12, textTransform: 'none' }} />
            <Tab label="Tiếng Việt" sx={{ minHeight: 32, py: 0, fontSize: 12, textTransform: 'none' }} />
          </Tabs>
        </Box>

        <LangTab value={lang} index={0}>
          <TextField label="Answer text" value={text} onChange={e => setText(e.target.value)}
            size="small" fullWidth />
          <TextField label="Feedback after choosing (optional)" value={feedback}
            onChange={e => setFeedback(e.target.value)} size="small" fullWidth sx={{ mt: 1 }} />
        </LangTab>

        <LangTab value={lang} index={1}>
          <TextField label="Answer text (VI)" value={textVi} onChange={e => setTextVi(e.target.value)}
            size="small" fullWidth />
          <TextField label="Feedback (VI, optional)" value={feedbackVi}
            onChange={e => setFeedbackVi(e.target.value)} size="small" fullWidth sx={{ mt: 1 }} />
        </LangTab>

        <Divider />

        {/* Routing + meta row */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ flex: 1, minWidth: 150 }}>
            <InputLabel>Next node</InputLabel>
            <Select label="Next node" value={nextId} onChange={e => setNextId(e.target.value as number | '')}>
              <MenuItem value=""><em>— End of story —</em></MenuItem>
              {nodes.filter(n => n.id !== currentNodeId).map(n => (
                <MenuItem key={n.id} value={n.id}>
                  {n.isStart ? '★ ' : ''}
                  {n.question.substring(0, 36)}{n.question.length > 36 ? '…' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Points"
            type="number"
            value={points}
            onChange={e => setPoints(Number(e.target.value))}
            size="small"
            sx={{ width: 76 }}
            slotProps={{ htmlInput: { min: 0 } }}
          />

          <TextField
            label="Color"
            value={color}
            onChange={e => setColor(e.target.value)}
            size="small"
            sx={{ width: 106 }}
            placeholder="#2563eb"
            slotProps={{
              input: {
                endAdornment: color
                  ? <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, flexShrink: 0, ml: 0.5 }} />
                  : null,
              },
            }}
          />

          <TextField
            label="#"
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
            size="small"
            sx={{ width: 56 }}
          />
        </Box>

        {/* Save button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            size="small"
            variant={isDirty ? 'contained' : 'outlined'}
            startIcon={saving ? <CircularProgress size={12} /> : <SaveIcon />}
            disabled={!isDirty || saving || !text.trim()}
            onClick={() => onSave({
              ...answer, text, textVi: textVi || null,
              pointsAwarded: points, nextNodeId: nextId === '' ? null : nextId,
              color: color || null, feedback: feedback || null,
              feedbackVi: feedbackVi || null, sortOrder,
            })}
            sx={{ fontSize: 12 }}
          >
            Save answer
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

// ── Node Edit Panel ───────────────────────────────────────────────────────────

interface NodeEditPanelProps {
  node: StoryNode
  allNodes: StoryNode[]
  detailId: number
}

export default function NodeEditPanel({ node, allNodes, detailId }: NodeEditPanelProps) {
  const qc = useQueryClient()

  const [lang,          setLang]          = useState(0)
  const [question,      setQuestion]      = useState(node.question)
  const [subtitle,      setSubtitle]      = useState(node.questionSubtitle ?? '')
  const [questionVi,    setQuestionVi]    = useState(node.questionVi ?? '')
  const [subtitleVi,    setSubtitleVi]    = useState(node.questionSubtitleVi ?? '')
  const [isStart,       setIsStart]       = useState(node.isStart)
  const [sortOrder,     setSortOrder]     = useState(node.sortOrder)
  const [bgImage,       setBgImage]       = useState(node.backgroundImageUrl ?? '')
  const [bgColor,       setBgColor]       = useState(node.backgroundColor ?? '')
  const [videoUrl,      setVideoUrl]      = useState(node.videoUrl ?? '')
  const [animation,     setAnimation]     = useState(node.animationType ?? '')
  const [visualOpen,    setVisualOpen]    = useState(false)
  const [previewOpen,   setPreviewOpen]   = useState(false)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['story-node-graph', detailId] })

  const { mutate: saveNode, isPending: savingNode } = useMutation({
    mutationFn: () => adminService.upsertStoryNode({
      id: node.id, storyDetailId: detailId, question, isStart,
      questionSubtitle: subtitle || undefined,
      questionVi: questionVi || undefined,
      questionSubtitleVi: subtitleVi || undefined,
      backgroundImageUrl: bgImage || undefined,
      backgroundColor: bgColor || undefined,
      videoUrl: videoUrl || undefined,
      animationType: animation || undefined,
      sortOrder,
    }),
    onSuccess: invalidate,
  })

  const { mutate: addAnswer, isPending: addingAnswer } = useMutation({
    mutationFn: () => adminService.upsertStoryNodeAnswer({
      storyNodeId: node.id, text: 'New answer', pointsAwarded: 0, sortOrder: node.answers.length,
    }),
    onSuccess: invalidate,
  })

  const { mutate: saveAnswer, isPending: savingAnswer } = useMutation({
    mutationFn: (a: StoryNodeAnswer) => adminService.upsertStoryNodeAnswer({
      id: a.id, storyNodeId: node.id, text: a.text, textVi: a.textVi ?? undefined,
      pointsAwarded: a.pointsAwarded, nextNodeId: a.nextNodeId,
      color: a.color ?? undefined, sortOrder: a.sortOrder,
      feedback: a.feedback ?? undefined, feedbackVi: a.feedbackVi ?? undefined,
    }),
    onSuccess: invalidate,
  })

  const { mutate: deleteAnswer } = useMutation({
    mutationFn: (id: number) => adminService.deleteStoryNodeAnswer(id),
    onSuccess: invalidate,
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* ── Node meta header ───────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            px: 1, py: 0.25, borderRadius: 1,
            bgcolor: node.isStart ? 'success.dark' : 'action.selected',
            fontSize: 11, fontFamily: 'monospace', color: node.isStart ? 'success.contrastText' : 'text.secondary',
          }}
        >
          {node.isStart ? '★ START' : `#${node.id}`}
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
          <FormControlLabel
            control={<Switch size="small" checked={isStart} onChange={e => setIsStart(e.target.checked)} />}
            label={<Typography variant="caption">Start node</Typography>}
            sx={{ mr: 0 }}
          />
          <TextField
            label="Sort"
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
            size="small"
            sx={{ width: 64 }}
          />
        </Box>
      </Box>

      {/* ── Question content (tabbed EN/VI) ───────────────────────────────── */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
        <Box sx={{ px: 1.5, pt: 1, pb: 0, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={lang} onChange={(_, v) => setLang(v)} sx={{ minHeight: 32 }}
            slotProps={{ indicator: { style: { height: 2 } } }}>
            <Tab label="English" sx={{ minHeight: 32, py: 0, fontSize: 12, textTransform: 'none' }} />
            <Tab label="Tiếng Việt" sx={{ minHeight: 32, py: 0, fontSize: 12, textTransform: 'none' }} />
          </Tabs>
        </Box>
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <LangTab value={lang} index={0}>
            <TextField label="Question *" value={question} onChange={e => setQuestion(e.target.value)}
              multiline rows={2} fullWidth size="small" />
            <TextField label="Subtitle (optional)" value={subtitle} onChange={e => setSubtitle(e.target.value)}
              fullWidth size="small" />
          </LangTab>
          <LangTab value={lang} index={1}>
            <TextField label="Question (VI)" value={questionVi} onChange={e => setQuestionVi(e.target.value)}
              multiline rows={2} fullWidth size="small" />
            <TextField label="Subtitle (VI, optional)" value={subtitleVi} onChange={e => setSubtitleVi(e.target.value)}
              fullWidth size="small" />
          </LangTab>
        </Box>
      </Box>

      {/* ── Visual settings (collapsible) ─────────────────────────────────── */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
        <Box
          onClick={() => setVisualOpen(v => !v)}
          sx={{
            px: 1.5, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
            cursor: 'pointer', bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
          }}
        >
          <ImageIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={600} sx={{ flex: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Visual settings
          </Typography>
          {(bgImage || bgColor || videoUrl || animation) && (
            <Chip label="configured" size="small"
              sx={{ height: 16, fontSize: 10, bgcolor: 'rgba(59,130,246,0.12)', color: 'primary.light' }} />
          )}
          <ExpandMoreIcon
            sx={{
              fontSize: 16, color: 'text.secondary',
              transform: visualOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </Box>
        <Collapse in={visualOpen}>
          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="Background image URL" value={bgImage} onChange={e => setBgImage(e.target.value)}
                size="small" fullWidth placeholder="https://..." />
              <TextField label="BG color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                size="small" sx={{ width: 110 }} placeholder="#0f172a"
                slotProps={{
                  input: {
                    endAdornment: bgColor
                      ? <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: bgColor, flexShrink: 0 }} />
                      : null,
                  },
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField label="Video URL" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                size="small" fullWidth placeholder="YouTube or direct URL" />
              <FormControl size="small" sx={{ width: 120 }}>
                <InputLabel>Animation</InputLabel>
                <Select label="Animation" value={animation} onChange={e => setAnimation(e.target.value)}>
                  {ANIMATION_TYPES.map(a => <MenuItem key={a} value={a}>{a || 'None'}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Collapse>
      </Box>

      {/* ── Save node button ───────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          startIcon={savingNode ? <CircularProgress size={14} /> : <SaveIcon />}
          disabled={savingNode || !question.trim()}
          onClick={() => saveNode()}
          sx={{ flex: 1 }}
        >
          Save node
        </Button>
        <Tooltip title="Preview this node as a player would see it">
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlayCircleOutlineIcon />}
            onClick={() => setPreviewOpen(true)}
            sx={{ flexShrink: 0 }}
          >
            Preview
          </Button>
        </Tooltip>
      </Box>

      <Divider />

      {/* ── Answers section ───────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Answers
          <Typography component="span" variant="caption" sx={{ ml: 0.75, color: 'text.secondary' }}>
            ({node.answers.length} / 5)
          </Typography>
        </Typography>
        <Button
          size="small"
          startIcon={addingAnswer ? <CircularProgress size={12} /> : <AddIcon />}
          disabled={node.answers.length >= 5 || addingAnswer}
          onClick={() => addAnswer()}
        >
          Add answer
        </Button>
      </Box>

      {node.answers.length < 2 && (
        <Alert severity="warning" sx={{ py: 0.5, fontSize: 12 }}>
          At least 2 answers are needed for branching.
        </Alert>
      )}

      <Stack gap={1.5}>
        {node.answers.map((a, i) => (
          <AnswerRow
            key={a.id}
            answer={a}
            index={i}
            nodes={allNodes}
            currentNodeId={node.id}
            onSave={ans => saveAnswer(ans)}
            onDelete={id => deleteAnswer(id)}
            saving={savingAnswer}
          />
        ))}
      </Stack>

      <NodePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        startNode={node}
        allNodes={allNodes}
      />
    </Box>
  )
}
