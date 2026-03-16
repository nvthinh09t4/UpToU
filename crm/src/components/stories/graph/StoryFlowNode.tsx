import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import FlagIcon from '@mui/icons-material/Flag'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import type { StoryNode, StoryNodeAnswer } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type StoryFlowNodeData = {
  storyNode: StoryNode
  isSelected: boolean
  onSelect: (id: number) => void
  onDelete: (id: number) => void
}

export type StoryFlowNodeType = Node<StoryFlowNodeData, 'storyNode'>

// ── Helpers ───────────────────────────────────────────────────────────────────

const answerColor = (a: StoryNodeAnswer) => a.color || '#6b7280'
const isTerminal  = (a: StoryNodeAnswer) => a.nextNodeId == null && !Object.keys(a.branchWeights ?? {}).length

// ── Component ─────────────────────────────────────────────────────────────────

function StoryFlowNode({ data }: NodeProps<StoryFlowNodeType>) {
  const { storyNode: node, isSelected, onSelect, onDelete } = data
  const hasEnding = node.answers.some(isTerminal)

  return (
    <Box
      onClick={() => onSelect(node.id)}
      sx={{
        width: 230,
        borderRadius: '10px',
        border: '2px solid',
        borderColor: isSelected ? '#3b82f6' : node.isStart ? '#22c55e' : '#374151',
        bgcolor: '#1e293b',
        cursor: 'pointer',
        boxShadow: isSelected
          ? '0 0 0 4px rgba(59,130,246,0.25), 0 4px 16px rgba(0,0,0,0.5)'
          : '0 4px 12px rgba(0,0,0,0.4)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        userSelect: 'none',
        '&:hover': { borderColor: isSelected ? '#3b82f6' : '#4b5563' },
      }}
    >
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      <Box
        sx={{
          px: 1.5, py: 0.6,
          bgcolor: node.isStart ? '#14532d' : '#0f172a',
          borderRadius: '8px 8px 0 0',
          display: 'flex', alignItems: 'center', gap: 0.5,
        }}
      >
        {node.isStart && <FlagIcon sx={{ fontSize: 12, color: '#4ade80' }} />}
        <Typography variant="caption" sx={{ color: '#64748b', flex: 1, fontSize: 10, fontFamily: 'monospace' }}>
          {node.isStart ? 'START · ' : ''}#{node.id}
        </Typography>
        {hasEnding && (
          <Tooltip title="Has a story-ending answer">
            <StopCircleIcon sx={{ fontSize: 12, color: '#fbbf24' }} />
          </Tooltip>
        )}
        <IconButton
          size="small"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(node.id) }}
          sx={{ p: 0.25, color: '#475569', '&:hover': { color: '#ef4444' } }}
        >
          <DeleteIcon sx={{ fontSize: 12 }} />
        </IconButton>
      </Box>

      {/* ── Question text ───────────────────────────────────────────────────── */}
      <Box sx={{ px: 1.5, pt: 1, pb: 0.75 }}>
        <Typography
          variant="body2"
          sx={{
            color: isSelected ? '#f1f5f9' : '#cbd5e1',
            fontWeight: isSelected ? 600 : 400,
            fontSize: 13,
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 0.5,
          }}
        >
          {node.question}
        </Typography>
        <Typography variant="caption" sx={{ color: '#475569', fontSize: 11 }}>
          {node.answers.length}/5 answers
          {node.answers.length === 0 && ' · ⚠ needs answers'}
        </Typography>
      </Box>

      {/* ── Answer labels (port hints) ──────────────────────────────────────── */}
      {node.answers.length > 0 && (
        <Box sx={{ px: 1.5, pb: 1, display: 'flex', flexDirection: 'column', gap: 0.3 }}>
          {node.answers.slice(0, 3).map(a => (
            <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: answerColor(a), flexShrink: 0 }} />
              <Typography
                variant="caption"
                sx={{ color: '#64748b', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {a.text}
              </Typography>
              {isTerminal(a) && (
                <StopCircleIcon sx={{ fontSize: 10, color: '#fbbf24', ml: 'auto', flexShrink: 0 }} />
              )}
            </Box>
          ))}
          {node.answers.length > 3 && (
            <Typography variant="caption" sx={{ color: '#475569', fontSize: 10 }}>
              +{node.answers.length - 3} more…
            </Typography>
          )}
        </Box>
      )}

      {/* ── Source handles (one per answer, right side) ─────────────────────── */}
      {node.answers.map((answer, i) => (
        <Handle
          key={answer.id}
          type="source"
          position={Position.Right}
          id={`ans-${answer.id}`}
          style={{
            background: answerColor(answer),
            width: 9, height: 9,
            border: '2px solid #1e293b',
            top: `${node.answers.length === 1 ? 50 : ((i + 0.5) / node.answers.length) * 100}%`,
            right: -5,
          }}
        />
      ))}

      {/* Fallback source when no answers yet */}
      {node.answers.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#374151', width: 9, height: 9, border: '2px solid #1e293b' }}
        />
      )}

      {/* ── Target handle (left side) ────────────────────────────────────────── */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#6b7280', width: 9, height: 9, border: '2px solid #1e293b', top: '50%' }}
      />
    </Box>
  )
}

export default memo(StoryFlowNode)
