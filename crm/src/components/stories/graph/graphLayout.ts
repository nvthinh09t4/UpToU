import type { StoryNode } from '@/types'

const COLUMN_GAP = 320
const ROW_GAP    = 180

/**
 * BFS layout starting from the start node.
 * Returns a map of nodeId → {x, y} positions.
 * Nodes unreachable from the start are placed in a leftmost overflow column.
 */
export function computeAutoLayout(nodes: StoryNode[]): Record<number, { x: number; y: number }> {
  if (nodes.length === 0) return {}

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const start   = nodes.find(n => n.isStart) ?? nodes[0]

  // BFS to assign each node a depth level
  const levels  = new Map<number, number>()
  const queue: { id: number; depth: number }[] = [{ id: start.id, depth: 0 }]
  const visited = new Set<number>()

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    levels.set(id, depth)

    const node = nodeMap.get(id)
    if (!node) continue

    for (const answer of node.answers) {
      if (answer.nextNodeId != null && !visited.has(answer.nextNodeId))
        queue.push({ id: answer.nextNodeId, depth: depth + 1 })

      for (const key of Object.keys(answer.branchWeights ?? {})) {
        const bid = parseInt(key, 10)
        if (!isNaN(bid) && !visited.has(bid))
          queue.push({ id: bid, depth: depth + 1 })
      }
    }
  }

  // Unreachable nodes go into column -1
  nodes.filter(n => !visited.has(n.id)).forEach(n => levels.set(n.id, -1))

  // Group by depth and assign x/y
  const byDepth = new Map<number, number[]>()
  for (const [id, depth] of levels) {
    if (!byDepth.has(depth)) byDepth.set(depth, [])
    byDepth.get(depth)!.push(id)
  }

  const positions: Record<number, { x: number; y: number }> = {}
  for (const [depth, ids] of byDepth) {
    const x = (depth + 1) * COLUMN_GAP
    ids.forEach((id, i) => {
      const y = (i - (ids.length - 1) / 2) * ROW_GAP
      positions[id] = { x, y }
    })
  }

  return positions
}

// ── localStorage helpers ──────────────────────────────────────────────────────

const storageKey = (detailId: number) => `stu-graph-pos-${detailId}`

export function loadStoredPositions(detailId: number): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(storageKey(detailId))
    return raw ? (JSON.parse(raw) as Record<string, { x: number; y: number }>) : {}
  } catch {
    return {}
  }
}

export function saveNodePosition(detailId: number, nodeId: number, pos: { x: number; y: number }): void {
  try {
    const stored = loadStoredPositions(detailId)
    stored[String(nodeId)] = pos
    localStorage.setItem(storageKey(detailId), JSON.stringify(stored))
  } catch {
    // localStorage might be full — fail silently
  }
}

export function clearStoredPositions(detailId: number): void {
  localStorage.removeItem(storageKey(detailId))
}
