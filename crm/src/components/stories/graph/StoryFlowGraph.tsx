import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap, Panel,
  applyNodeChanges, applyEdgeChanges,
  useReactFlow,
  type NodeChange, type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Button, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import FitScreenIcon from '@mui/icons-material/FitScreen'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import type { StoryNode } from '@/types'
import StoryFlowNode, { type StoryFlowNodeType } from './StoryFlowNode'
import StoryFlowEdge, { type StoryFlowEdgeType } from './StoryFlowEdge'
import { computeAutoLayout, loadStoredPositions, saveNodePosition, clearStoredPositions } from './graphLayout'

// ── Type registrations ────────────────────────────────────────────────────────

const NODE_TYPES = { storyNode: StoryFlowNode } as const
const EDGE_TYPES = { storyEdge: StoryFlowEdge } as const

// ── Edge builder ──────────────────────────────────────────────────────────────

function buildEdges(nodes: StoryNode[]): StoryFlowEdgeType[] {
  const edges: StoryFlowEdgeType[] = []

  for (const node of nodes) {
    for (const answer of node.answers) {
      const color  = answer.color || '#6b7280'
      const label  = answer.text.length > 40 ? answer.text.slice(0, 40) + '…' : answer.text
      const marker = `url(#arrow-${color.replace('#', '')})`
      const base   = {
        type: 'storyEdge' as const,
        sourceHandle: `ans-${answer.id}`,
        source: String(node.id),
        markerEnd: marker,
      }

      if (answer.nextNodeId != null) {
        edges.push({
          ...base,
          id: `e-${answer.id}`,
          target: String(answer.nextNodeId),
          data: { label, color, pointsAwarded: answer.pointsAwarded },
        })
      }

      for (const [targetStr, weight] of Object.entries(answer.branchWeights ?? {})) {
        const tid = parseInt(targetStr, 10)
        if (isNaN(tid)) continue
        const total  = Object.values(answer.branchWeights!).reduce((s, w) => s + w, 0)
        const branchPct = total > 0 ? Math.round((weight / total) * 100) : weight
        edges.push({
          ...base,
          id: `ebw-${answer.id}-${tid}`,
          target: String(tid),
          data: { label, color: answer.color || '#a78bfa', isBranch: true, branchPct },
        })
      }
    }
  }

  return edges
}

// ── FitView trigger (must be inside ReactFlow) ────────────────────────────────

function FitViewOnDetailChange({ detailId }: { detailId: number }) {
  const { fitView }   = useReactFlow()
  const prevDetailRef = useRef<number | null>(null)

  useEffect(() => {
    if (prevDetailRef.current !== detailId) {
      prevDetailRef.current = detailId
      const t = setTimeout(() => fitView({ padding: 0.3, maxZoom: 1.1, duration: 300 }), 80)
      return () => clearTimeout(t)
    }
  }, [detailId, fitView])

  return null
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  storyNodes: StoryNode[]
  selectedNodeId: number | null
  detailId: number
  onSelectNode: (id: number | null) => void
  onDeleteNode: (id: number) => void
  onAddNode: () => void
  addingNode?: boolean
}

export default function StoryFlowGraph({
  storyNodes, selectedNodeId, detailId,
  onSelectNode, onDeleteNode, onAddNode, addingNode,
}: Props) {
  const [rfNodes, setRfNodes] = useState<StoryFlowNodeType[]>([])
  const [rfEdges, setRfEdges] = useState<StoryFlowEdgeType[]>([])
  const posRef        = useRef<Record<string, { x: number; y: number }>>({})
  const prevDetailRef = useRef<number | null>(null)

  const onSelect = useCallback((id: number) => onSelectNode(id), [onSelectNode])
  const onDelete = useCallback((id: number) => onDeleteNode(id), [onDeleteNode])

  // ── Rebuild nodes when story graph changes ────────────────────────────────
  useEffect(() => {
    if (prevDetailRef.current !== detailId) {
      posRef.current        = {}
      prevDetailRef.current = detailId
    }

    const stored = loadStoredPositions(detailId)
    const auto   = computeAutoLayout(storyNodes)

    storyNodes.forEach(n => {
      const key = String(n.id)
      if (!posRef.current[key])
        posRef.current[key] = stored[key] ?? auto[n.id] ?? { x: 80, y: 80 }
    })

    setRfNodes(storyNodes.map(n => ({
      id: String(n.id),
      type: 'storyNode' as const,
      position: posRef.current[String(n.id)],
      data: { storyNode: n, isSelected: n.id === selectedNodeId, onSelect, onDelete },
    })))
    setRfEdges(buildEdges(storyNodes))
  // selectedNodeId intentionally excluded — handled in the effect below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyNodes, detailId, onSelect, onDelete])

  // ── Update selection highlight without rebuilding positions ───────────────
  useEffect(() => {
    setRfNodes(prev =>
      prev.map(n => ({ ...n, data: { ...n.data, isSelected: parseInt(n.id, 10) === selectedNodeId } }))
    )
  }, [selectedNodeId])

  // ── Drag / change handlers ─────────────────────────────────────────────────
  const onNodesChange = useCallback((changes: NodeChange<StoryFlowNodeType>[]) => {
    setRfNodes(prev => {
      const next = applyNodeChanges(changes, prev)
      next.forEach(n => { posRef.current[n.id] = n.position })
      return next
    })
    changes.forEach(c => {
      if (c.type === 'position' && !c.dragging && c.position)
        saveNodePosition(detailId, parseInt(c.id, 10), c.position)
    })
  }, [detailId])

  const onEdgesChange = useCallback(
    (changes: EdgeChange<StoryFlowEdgeType>[]) =>
      setRfEdges(prev => applyEdgeChanges(changes, prev)),
    [],
  )

  return (
    <Box sx={{ flex: 1, height: '100%', borderRadius: 2, overflow: 'hidden', bgcolor: '#0f172a' }}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={() => onSelectNode(null)}
        deleteKeyCode={null}
        minZoom={0.1}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
        defaultEdgeOptions={{ type: 'storyEdge' }}
      >
        <FitViewOnDetailChange detailId={detailId} />

        <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={22} size={1.5} />

        <Controls showInteractive={false} style={{ background: '#1e293b', border: '1px solid #334155' }} />

        <MiniMap
          nodeColor={n =>
            (n as StoryFlowNodeType).data?.isSelected ? '#3b82f6'
              : (n as StoryFlowNodeType).data?.storyNode?.isStart ? '#22c55e'
              : '#334155'
          }
          style={{ background: '#1e293b', border: '1px solid #334155' }}
          pannable
          zoomable
        />

        {/* ── Toolbar panel ──────────────────────────────────────────────── */}
        <Panel position="top-right">
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Reset layout">
              <Button
                size="small" variant="outlined"
                onClick={() => { clearStoredPositions(detailId); posRef.current = {} }}
                sx={{ minWidth: 0, px: 1, bgcolor: '#1e293b', borderColor: '#334155', color: '#94a3b8',
                  '&:hover': { bgcolor: '#334155' } }}
              >
                <DeleteSweepIcon fontSize="small" />
              </Button>
            </Tooltip>
            <Button
              size="small" variant="contained"
              startIcon={<AddIcon />}
              disabled={addingNode}
              onClick={onAddNode}
              sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' }, fontWeight: 600, fontSize: 13 }}
            >
              Add Node
            </Button>
          </Box>
        </Panel>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {storyNodes.length === 0 && (
          <Panel position="top-center">
            <Box sx={{ mt: 8, textAlign: 'center', color: '#475569' }}>
              <FitScreenIcon sx={{ fontSize: 48, mb: 1, display: 'block', mx: 'auto', opacity: 0.4 }} />
              No nodes yet — click <strong style={{ color: '#3b82f6' }}>Add Node</strong> to start building.
            </Box>
          </Panel>
        )}
      </ReactFlow>
    </Box>
  )
}
