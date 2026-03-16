import { useState } from 'react'
import {
  Box, Button, Chip, Dialog, DialogContent, DialogTitle,
  Divider, IconButton, Stack, Tab, Tabs, Tooltip, Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import FlagIcon from '@mui/icons-material/Flag'
import { Stop as StopIcon } from '@mui/icons-material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import type { StoryNode, StoryNodeAnswer } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type PreviewPhase = 'question' | 'feedback'

interface AnswerResult {
  answer: StoryNodeAnswer
  nextNode: StoryNode | null
  isTerminal: boolean
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PointsBadge({ points }: { points: number }) {
  if (points === 0) return null
  return (
    <Chip
      label={`${points > 0 ? '+' : ''}${points} pts`}
      size="small"
      sx={{
        height: 20,
        fontSize: 11,
        fontWeight: 700,
        bgcolor: points > 0 ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
        color: points > 0 ? '#4ade80' : '#f87171',
        border: '1px solid',
        borderColor: points > 0 ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)',
      }}
    />
  )
}

function NodeBreadcrumb({ node, lang }: { node: StoryNode; lang: number }) {
  const q = (lang === 1 && node.questionVi) ? node.questionVi : node.question
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {node.isStart && <FlagIcon sx={{ fontSize: 13, color: '#4ade80' }} />}
      <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: 10 }}>
        #{node.id}
      </Typography>
      <Typography variant="caption" noWrap sx={{ color: '#94a3b8', maxWidth: 220 }}>
        {q.length > 50 ? q.slice(0, 50) + '…' : q}
      </Typography>
    </Box>
  )
}

// ── Main dialog ───────────────────────────────────────────────────────────────

interface NodePreviewDialogProps {
  open: boolean
  onClose: () => void
  startNode: StoryNode
  allNodes: StoryNode[]
}

export default function NodePreviewDialog({ open, onClose, startNode, allNodes }: NodePreviewDialogProps) {
  const [lang,         setLang]         = useState(0)
  const [currentNode,  setCurrentNode]  = useState<StoryNode>(startNode)
  const [phase,        setPhase]        = useState<PreviewPhase>('question')
  const [result,       setResult]       = useState<AnswerResult | null>(null)
  const [history,      setHistory]      = useState<StoryNode[]>([])

  const q        = (lang === 1 && currentNode.questionVi)        ? currentNode.questionVi        : currentNode.question
  const subtitle = (lang === 1 && currentNode.questionSubtitleVi) ? currentNode.questionSubtitleVi : currentNode.questionSubtitle

  function handleChoose(answer: StoryNodeAnswer) {
    const nextNode   = answer.nextNodeId != null ? (allNodes.find(n => n.id === answer.nextNodeId) ?? null) : null
    const isTerminal = answer.nextNodeId == null
    setResult({ answer, nextNode, isTerminal })
    setPhase('feedback')
  }

  function handleContinue() {
    if (!result || !result.nextNode) return
    setHistory(h => [...h, currentNode])
    setCurrentNode(result.nextNode)
    setResult(null)
    setPhase('question')
  }

  function handleBack() {
    const prev = history[history.length - 1]
    if (!prev) return
    setHistory(h => h.slice(0, -1))
    setCurrentNode(prev)
    setResult(null)
    setPhase('question')
  }

  function handleReset() {
    setCurrentNode(startNode)
    setResult(null)
    setPhase('question')
    setHistory([])
  }

  const feedbackText = result
    ? ((lang === 1 && result.answer.feedbackVi) ? result.answer.feedbackVi : result.answer.feedback)
    : null

  const bgStyle: React.CSSProperties = currentNode.backgroundImageUrl
    ? { backgroundImage: `url(${currentNode.backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  const overlayBg = currentNode.backgroundColor || '#0f172a'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#0f172a',
            backgroundImage: 'none',
            borderRadius: 2,
            border: '1px solid #1e293b',
            overflow: 'hidden',
            maxHeight: '90vh',
          },
        },
      }}
    >
      {/* ── Dialog title bar ─────────────────────────────────────────────── */}
      <DialogTitle
        sx={{
          px: 2, py: 1, bgcolor: '#0a0f1e',
          borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', gap: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f1f5f9', flex: 1 }}>
          Story Preview
        </Typography>

        {/* History breadcrumb */}
        {history.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
            {history.slice(-2).map((n, i) => (
              <Box key={n.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#334155', fontFamily: 'monospace', fontSize: 10 }}>
                  #{n.id}
                </Typography>
                {i < history.slice(-2).length - 1 && (
                  <ArrowForwardIcon sx={{ fontSize: 10, color: '#334155' }} />
                )}
              </Box>
            ))}
            <ArrowForwardIcon sx={{ fontSize: 10, color: '#475569' }} />
            <Typography variant="caption" sx={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: 10 }}>
              #{currentNode.id}
            </Typography>
          </Box>
        )}

        {/* Language switcher */}
        <Tabs
          value={lang}
          onChange={(_, v) => setLang(v)}
          sx={{ minHeight: 28 }}
          slotProps={{ indicator: { style: { height: 2 } } }}
        >
          <Tab label="EN" sx={{ minHeight: 28, py: 0, px: 1.5, fontSize: 11, textTransform: 'none', color: '#64748b',
            '&.Mui-selected': { color: '#f1f5f9' } }} />
          <Tab label="VI" sx={{ minHeight: 28, py: 0, px: 1.5, fontSize: 11, textTransform: 'none', color: '#64748b',
            '&.Mui-selected': { color: '#f1f5f9' } }} />
        </Tabs>

        <Tooltip title="Reset to start">
          <IconButton size="small" onClick={handleReset} sx={{ color: '#475569', p: 0.5 }}>
            <RestartAltIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={onClose} sx={{ color: '#475569', p: 0.5 }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>

        {/* ── Scene area ─────────────────────────────────────────────────── */}
        <Box
          sx={{
            position: 'relative', minHeight: 160,
            ...bgStyle,
          }}
        >
          {/* Background overlay */}
          <Box
            sx={{
              position: 'absolute', inset: 0,
              bgcolor: currentNode.backgroundImageUrl
                ? 'rgba(0,0,0,0.55)'
                : overlayBg,
            }}
          />

          {/* Question content */}
          <Box sx={{ position: 'relative', p: 3, pb: 2.5 }}>
            <NodeBreadcrumb node={currentNode} lang={lang} />
            <Typography
              variant="h6"
              sx={{
                color: '#f1f5f9', fontWeight: 700, lineHeight: 1.4,
                mt: 1.5, mb: subtitle ? 0.75 : 0,
                fontSize: { xs: 16, sm: 18 },
              }}
            >
              {q}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#1e293b' }} />

        {/* ── Question phase: answer buttons ─────────────────────────────── */}
        {phase === 'question' && (
          <Box sx={{ p: 2.5 }}>
            {currentNode.answers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, color: '#475569' }}>
                <Typography variant="body2">No answers configured for this node.</Typography>
              </Box>
            ) : (
              <Stack gap={1.25}>
                {currentNode.answers.map(answer => {
                  const answerText = (lang === 1 && answer.textVi) ? answer.textVi : answer.text
                  const isEnd      = answer.nextNodeId == null
                  const dotColor   = answer.color || '#6b7280'

                  return (
                    <Button
                      key={answer.id}
                      fullWidth
                      variant="outlined"
                      onClick={() => handleChoose(answer)}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        px: 2, py: 1.25,
                        borderColor: dotColor + '55',
                        color: '#e2e8f0',
                        bgcolor: dotColor + '0d',
                        borderRadius: 1.5,
                        textTransform: 'none',
                        fontSize: 14,
                        fontWeight: 500,
                        lineHeight: 1.4,
                        gap: 1.5,
                        '&:hover': {
                          borderColor: dotColor + 'aa',
                          bgcolor: dotColor + '1a',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 8, height: 8, borderRadius: '50%',
                          bgcolor: dotColor, flexShrink: 0, mt: '2px',
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        {answerText}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
                        {answer.pointsAwarded !== 0 && (
                          <PointsBadge points={answer.pointsAwarded} />
                        )}
                        {isEnd && (
                          <Chip
                            icon={<StopIcon sx={{ fontSize: '11px !important' }} />}
                            label="Ends"
                            size="small"
                            sx={{
                              height: 18, fontSize: 10,
                              bgcolor: 'rgba(234,179,8,0.12)',
                              color: '#fbbf24',
                              border: '1px solid rgba(234,179,8,0.3)',
                              '& .MuiChip-icon': { color: '#fbbf24' },
                            }}
                          />
                        )}
                      </Box>
                    </Button>
                  )
                })}
              </Stack>
            )}
          </Box>
        )}

        {/* ── Feedback phase ─────────────────────────────────────────────── */}
        {phase === 'feedback' && result && (
          <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Chosen answer recap */}
            <Box
              sx={{
                p: 1.5, borderRadius: 1.5,
                border: '1px solid',
                borderColor: (result.answer.color || '#6b7280') + '55',
                bgcolor: (result.answer.color || '#6b7280') + '10',
                display: 'flex', alignItems: 'flex-start', gap: 1.25,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 18, color: result.answer.color || '#6b7280', mt: '1px', flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                  {(lang === 1 && result.answer.textVi) ? result.answer.textVi : result.answer.text}
                </Typography>
              </Box>
              <PointsBadge points={result.answer.pointsAwarded} />
            </Box>

            {/* Feedback text */}
            {feedbackText ? (
              <Box
                sx={{
                  p: 1.5, borderRadius: 1.5,
                  bgcolor: '#1e293b', border: '1px solid #334155',
                }}
              >
                <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase',
                  letterSpacing: 0.5, fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Feedback
                </Typography>
                <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                  {feedbackText}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#1a1f2e', border: '1px dashed #2d3748',
                textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#475569' }}>
                  No feedback text for this answer
                </Typography>
              </Box>
            )}

            {/* What happens next */}
            <Box
              sx={{
                p: 1.5, borderRadius: 1.5,
                bgcolor: result.isTerminal ? 'rgba(234,179,8,0.08)' : 'rgba(59,130,246,0.08)',
                border: '1px solid',
                borderColor: result.isTerminal ? 'rgba(234,179,8,0.3)' : 'rgba(59,130,246,0.25)',
              }}
            >
              <Typography variant="caption" sx={{
                color: result.isTerminal ? '#fbbf24' : '#60a5fa',
                textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, display: 'block', mb: 0.5,
              }}>
                {result.isTerminal ? 'Story ends here' : 'Next'}
              </Typography>
              {result.isTerminal ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <StopIcon sx={{ fontSize: 15, color: '#fbbf24' }} />
                  <Typography variant="body2" sx={{ color: '#fbbf24' }}>
                    This is the end of the story
                  </Typography>
                </Box>
              ) : result.nextNode ? (
                <NodeBreadcrumb node={result.nextNode} lang={lang} />
              ) : (
                <Typography variant="body2" sx={{ color: '#ef4444' }}>
                  ⚠ Next node #{result.answer.nextNodeId} not found in this revision
                </Typography>
              )}
            </Box>

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {history.length > 0 && (
                <Button size="small" variant="outlined" onClick={handleBack}
                  sx={{ color: '#64748b', borderColor: '#334155', fontSize: 12 }}>
                  ← Back
                </Button>
              )}
              <Button size="small" variant="outlined" onClick={() => setPhase('question')}
                sx={{ color: '#64748b', borderColor: '#334155', fontSize: 12 }}>
                Re-choose
              </Button>
              {!result.isTerminal && result.nextNode && (
                <Button
                  size="small"
                  variant="contained"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={handleContinue}
                  sx={{ ml: 'auto', fontSize: 12 }}
                >
                  Continue
                </Button>
              )}
              {result.isTerminal && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                  onClick={handleReset}
                  sx={{ ml: 'auto', fontSize: 12, borderColor: '#fbbf24', color: '#fbbf24',
                    '&:hover': { borderColor: '#f59e0b', bgcolor: 'rgba(234,179,8,0.08)' } }}
                >
                  Play again
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* ── Navigation footer ──────────────────────────────────────────── */}
        <Box
          sx={{
            px: 2, py: 1, borderTop: '1px solid #1e293b',
            display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#0a0f1e',
          }}
        >
          <Typography variant="caption" sx={{ color: '#334155', flex: 1 }}>
            {allNodes.length} node{allNodes.length !== 1 ? 's' : ''} in this revision
            {history.length > 0 && ` · ${history.length} step${history.length !== 1 ? 's' : ''} in`}
          </Typography>
          {/* Jump-to buttons for all nodes */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {allNodes.map(n => (
              <Tooltip key={n.id} title={`Jump to #${n.id}: ${n.question.slice(0, 40)}`}>
                <Box
                  component="button"
                  onClick={() => {
                    setCurrentNode(n)
                    setResult(null)
                    setPhase('question')
                    setHistory([])
                  }}
                  sx={{
                    width: 24, height: 24, borderRadius: '6px',
                    border: '1px solid',
                    borderColor: n.id === currentNode.id ? '#3b82f6' : '#1e293b',
                    bgcolor: n.id === currentNode.id
                      ? 'rgba(59,130,246,0.2)'
                      : n.isStart ? 'rgba(34,197,94,0.12)' : 'transparent',
                    color: n.id === currentNode.id ? '#60a5fa'
                      : n.isStart ? '#4ade80' : '#475569',
                    fontSize: 9,
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    '&:hover': { borderColor: '#334155', bgcolor: '#1e293b' },
                    transition: 'all 0.1s',
                  }}
                >
                  {n.id}
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>

      </DialogContent>
    </Dialog>
  )
}
