import { memo, useState } from 'react'
import {
  BaseEdge, EdgeLabelRenderer, getBezierPath,
  type EdgeProps, type Edge,
} from '@xyflow/react'

// ── Types ─────────────────────────────────────────────────────────────────────

export type StoryFlowEdgeData = {
  label: string
  color: string
  isBranch?: boolean
  branchPct?: number
  pointsAwarded?: number
}

export type StoryFlowEdgeType = Edge<StoryFlowEdgeData, 'storyEdge'>

// ── Component ─────────────────────────────────────────────────────────────────

function StoryFlowEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, markerEnd,
}: EdgeProps<StoryFlowEdgeType>) {
  const [hovered, setHovered] = useState(false)

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature: 0.35,
  })

  const color     = data?.color ?? '#6b7280'
  const isBranch  = data?.isBranch ?? false
  const baseAlpha = isBranch ? 'aa' : 'cc'

  return (
    <>
      {/* ── Wide transparent hit area for comfortable hover ────────────────── */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        style={{ cursor: 'default' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* ── Glow layer (visible only on hover) ────────────────────────────── */}
      {hovered && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeOpacity={0.18}
          style={{ pointerEvents: 'none' }}
          strokeDasharray={isBranch ? '8 4' : undefined}
        />
      )}

      {/* ── Main visible edge ─────────────────────────────────────────────── */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: hovered ? color : color + baseAlpha,
          strokeWidth: hovered ? 2.5 : 1.8,
          strokeDasharray: isBranch ? '7 3.5' : undefined,
          transition: 'stroke 0.12s, stroke-width 0.12s',
          pointerEvents: 'none',
        }}
      />

      {/* ── Hover label ───────────────────────────────────────────────────── */}
      {hovered && data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              zIndex: 999,
            }}
            className="nodrag nopan"
          >
            <div
              style={{
                background: '#1e293b',
                border: `1px solid ${color}55`,
                borderRadius: 7,
                padding: '4px 10px',
                fontSize: 11,
                color: '#e2e8f0',
                whiteSpace: 'nowrap',
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                boxShadow: `0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px ${color}22`,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: color, flexShrink: 0, display: 'inline-block',
                }}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {data.label}
              </span>
              {isBranch && data.branchPct != null && (
                <span style={{ color: '#64748b', flexShrink: 0 }}>
                  {data.branchPct}%
                </span>
              )}
              {!isBranch && (data.pointsAwarded ?? 0) !== 0 && (
                <span style={{
                  color: (data.pointsAwarded ?? 0) > 0 ? '#4ade80' : '#f87171',
                  flexShrink: 0, fontWeight: 600,
                }}>
                  {(data.pointsAwarded ?? 0) > 0 ? '+' : ''}{data.pointsAwarded}
                </span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(StoryFlowEdge)
