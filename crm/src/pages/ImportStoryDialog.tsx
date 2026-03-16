import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, CircularProgress, Collapse,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  IconButton, LinearProgress, List, ListItem, ListItemIcon,
  ListItemText, Stack, Tooltip, Typography,
} from '@mui/material'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import DownloadIcon from '@mui/icons-material/Download'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import TuneIcon from '@mui/icons-material/Tune'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { adminService } from '@/services/adminService'
import type { Category } from '@/types'

// ── JSON schema types ─────────────────────────────────────────────────────────

interface JsonAnswer {
  text: string
  pointsAwarded?: number
  nextNodeRef?: string | null   // ref of next node, null/"end" = story end
  color?: string | null
  sortOrder?: number
  feedback?: string | null
  feedbackVi?: string | null
  scoreDeltas?: Record<string, number>
}

interface JsonNode {
  ref: string
  question: string
  questionSubtitle?: string | null
  isStart?: boolean
  backgroundImageUrl?: string | null
  backgroundColor?: string | null
  videoUrl?: string | null
  animationType?: 'fade' | 'slide-left' | 'zoom' | null
  sortOrder?: number
  answers: JsonAnswer[]
}

interface JsonStory {
  title: string
  description?: string | null
  excerpt?: string | null
  coverImageUrl?: string | null
  authorName?: string | null
  categoryId: number
  storyType?: string
  savePath?: string | null
  content?: string | null
  scoreWeight?: number
  nodes: JsonNode[]
}

// ── Validation ────────────────────────────────────────────────────────────────

interface ValidationResult {
  errors: string[]
  warnings: string[]
  data: JsonStory | null
}

function validate(raw: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { errors: ['Root value must be a JSON object.'], warnings, data: null }
  }

  const obj = raw as Record<string, unknown>

  if (!obj.title || typeof obj.title !== 'string' || !obj.title.trim())
    errors.push('"title" is required and must be a non-empty string.')

  if (!obj.categoryId || typeof obj.categoryId !== 'number' || obj.categoryId < 1)
    errors.push('"categoryId" is required and must be a positive integer.')

  if (!Array.isArray(obj.nodes) || obj.nodes.length === 0)
    errors.push('"nodes" is required and must be a non-empty array.')

  if (errors.length > 0) return { errors, warnings, data: null }

  const nodes = obj.nodes as JsonNode[]

  // Collect all refs
  const refs = new Set<string>()
  const duplicateRefs = new Set<string>()
  for (const n of nodes) {
    if (!n.ref || typeof n.ref !== 'string')
      errors.push(`A node is missing a "ref" field (question: "${n.question ?? '?'}")`)
    else if (refs.has(n.ref))
      duplicateRefs.add(n.ref)
    else
      refs.add(n.ref)

    if (!n.question || typeof n.question !== 'string' || !n.question.trim())
      errors.push(`Node "${n.ref ?? '?'}" is missing a "question" field.`)

    if (!Array.isArray(n.answers) || n.answers.length === 0)
      errors.push(`Node "${n.ref ?? '?'}" has no answers.`)
    else if (n.answers.length < 2)
      warnings.push(`Node "${n.ref}" has only ${n.answers.length} answer — recommended minimum is 2.`)

    for (const a of n.answers ?? []) {
      if (!a.text || typeof a.text !== 'string' || !a.text.trim())
        errors.push(`An answer in node "${n.ref ?? '?'}" is missing "text".`)
    }
  }

  for (const r of duplicateRefs)
    errors.push(`Duplicate node ref: "${r}". Each ref must be unique.`)

  // Validate nextNodeRef links
  for (const n of nodes) {
    for (const a of n.answers ?? []) {
      if (a.nextNodeRef && a.nextNodeRef !== 'end' && !refs.has(a.nextNodeRef))
        errors.push(`Answer "${a.text ?? '?'}" in node "${n.ref}" references unknown ref "${a.nextNodeRef}".`)
    }
  }

  // Start node
  const startCount = nodes.filter((n) => n.isStart).length
  if (startCount === 0)
    warnings.push('No node has "isStart": true — the first node in the array will be used as the start.')
  if (startCount > 1)
    errors.push(`Only one node may have "isStart": true (found ${startCount}).`)

  if (errors.length > 0) return { errors, warnings, data: null }

  const data = raw as JsonStory
  // Normalise: if no isStart, mark the first node
  if (!data.nodes.some((n) => n.isStart)) data.nodes[0].isStart = true

  return { errors, warnings, data }
}

// ── Example JSON ──────────────────────────────────────────────────────────────

const EXAMPLE_JSON: JsonStory = {
  title: 'The Investment Decision',
  description: 'Navigate a financial crisis as a junior analyst. Every decision carries risk.',
  excerpt: 'Your choices will shape the firm\'s future — and your career.',
  coverImageUrl: null,
  authorName: 'Your Name',
  categoryId: 1,
  storyType: 'Interactive',
  savePath: 'the-investment-decision',
  scoreWeight: 1,
  nodes: [
    {
      ref: 'start',
      question: 'The CEO bursts into your office. A major client is pulling $50M unless you can present an alternative strategy in one hour. What do you do?',
      questionSubtitle: 'You have exactly 60 minutes.',
      isStart: true,
      backgroundColor: '#0f172a',
      animationType: 'fade',
      sortOrder: 1,
      answers: [
        { text: 'Pull up the data and run a quick analysis', pointsAwarded: 15, nextNodeRef: 'analyze', color: '#6366f1', sortOrder: 1 },
        { text: 'Call a senior colleague for advice', pointsAwarded: 8, nextNodeRef: 'consult', color: '#f59e0b', sortOrder: 2 },
        { text: 'Trust your gut and draft a proposal immediately', pointsAwarded: 3, nextNodeRef: 'react', color: '#94a3b8', sortOrder: 3 },
      ],
    },
    {
      ref: 'analyze',
      question: 'Your analysis reveals two viable options. Option A is safer but yields 8% returns. Option B is riskier but could yield 22%.',
      isStart: false,
      backgroundColor: '#0a1628',
      animationType: 'slide-left',
      sortOrder: 2,
      answers: [
        { text: 'Recommend Option A — protect the relationship', pointsAwarded: 20, nextNodeRef: null, color: '#22c55e', sortOrder: 1, feedback: 'Conservative but effective. The client appreciates the transparency.' },
        { text: 'Recommend Option B — go for growth', pointsAwarded: 10, nextNodeRef: null, color: '#ef4444', sortOrder: 2, feedback: 'Bold move. The client is intrigued but asks for more due diligence.' },
      ],
    },
    {
      ref: 'consult',
      question: 'Your colleague suggests a hybrid strategy — split the investment 60/40. It\'s unconventional but might just work.',
      isStart: false,
      backgroundColor: '#0f172a',
      animationType: 'fade',
      sortOrder: 3,
      answers: [
        { text: 'Present the hybrid strategy confidently', pointsAwarded: 18, nextNodeRef: null, color: '#6366f1', sortOrder: 1 },
        { text: 'Modify it with your own insight first', pointsAwarded: 22, nextNodeRef: null, color: '#a78bfa', sortOrder: 2 },
      ],
    },
    {
      ref: 'react',
      question: 'Your rushed proposal contains a calculation error. The CEO spots it immediately in front of the client.',
      isStart: false,
      backgroundColor: '#1a0a0a',
      animationType: 'zoom',
      sortOrder: 4,
      answers: [
        { text: 'Own the mistake and offer to redo the analysis on the spot', pointsAwarded: 12, nextNodeRef: null, color: '#6366f1', sortOrder: 1 },
        { text: 'Blame the time pressure and request a follow-up meeting', pointsAwarded: 4, nextNodeRef: null, color: '#94a3b8', sortOrder: 2 },
      ],
    },
  ],
}

function downloadExample() {
  const blob = new Blob([JSON.stringify(EXAMPLE_JSON, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'story-import-example.json'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Guide section ─────────────────────────────────────────────────────────────

function GuideSection() {
  const [open, setOpen] = useState(false)
  const field = (name: string, type: string, required: boolean, desc: string) => (
    <Box key={name} sx={{ display: 'grid', gridTemplateColumns: '160px 90px 1fr', gap: 1, alignItems: 'baseline', py: 0.5 }}>
      <Typography variant="caption" fontFamily="monospace" color="primary.main" fontWeight={700}>{name}</Typography>
      <Typography variant="caption" color="text.disabled" fontFamily="monospace">{type}</Typography>
      <Typography variant="caption" color="text.secondary">{required ? <Chip label="required" size="small" color="error" sx={{ mr: 0.5, height: 16, fontSize: 10 }} /> : null}{desc}</Typography>
    </Box>
  )

  return (
    <Box sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between"
        sx={{ px: 2, py: 1.25, cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen((v) => !v)}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <InfoOutlinedIcon fontSize="small" color="info" />
          <Typography variant="body2" fontWeight={600}>JSON Format Guide</Typography>
        </Stack>
        <IconButton size="small">{open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</IconButton>
      </Stack>

      <Collapse in={open}>
        <Divider />
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Story fields (top-level)</Typography>
          {field('title', 'string', true, 'Display title of the story.')}
          {field('categoryId', 'number', true, 'ID of the category this story belongs to.')}
          {field('nodes', 'array', true, 'Array of story node objects.')}
          {field('description', 'string', false, 'Full description shown on the story page.')}
          {field('excerpt', 'string', false, 'Short teaser (1–2 sentences).')}
          {field('coverImageUrl', 'string', false, 'URL of the cover image.')}
          {field('authorName', 'string', false, 'Display name of the author.')}
          {field('storyType', 'string', false, 'Story type. Use "Interactive" (default).')}
          {field('savePath', 'string', false, 'URL slug (e.g. "my-story"). Auto-generated if omitted.')}
          {field('scoreWeight', 'number', false, 'Multiplier for score calculations. Default: 1.')}

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" gutterBottom>Node fields (inside <code>nodes[]</code>)</Typography>
          {field('ref', 'string', true, 'Unique identifier used to link answers to this node (e.g. "start", "node-2").')}
          {field('question', 'string', true, 'The main question/scenario text shown to the player.')}
          {field('isStart', 'boolean', false, 'Mark exactly one node as the entry point. Defaults to the first node.')}
          {field('answers', 'array', true, 'Array of answer objects. Minimum 2 recommended.')}
          {field('questionSubtitle', 'string', false, 'Optional subtitle shown below the question.')}
          {field('backgroundColor', 'string', false, 'Hex background color (e.g. "#0f172a").')}
          {field('backgroundImageUrl', 'string', false, 'URL of the background image.')}
          {field('animationType', 'string', false, '"fade", "slide-left", or "zoom".')}
          {field('sortOrder', 'number', false, 'Display order. Default: array index.')}

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="subtitle2" gutterBottom>Answer fields (inside <code>node.answers[]</code>)</Typography>
          {field('text', 'string', true, 'The answer text shown to the player.')}
          {field('nextNodeRef', 'string', false, 'ref of the next node, or null/"end" to end the story.')}
          {field('pointsAwarded', 'number', false, 'Base points awarded when this answer is chosen. Default: 0.')}
          {field('color', 'string', false, 'Accent color for the answer button (hex).')}
          {field('sortOrder', 'number', false, 'Display order. Default: array index.')}
          {field('feedback', 'string', false, 'Explanation shown after the player picks this answer.')}
          {field('scoreDeltas', 'object', false, 'Map of score-type-name → delta (e.g. {"risk": 5, "trust": -2}).')}

          <Alert severity="info" sx={{ mt: 1.5, fontSize: 12 }}>
            After import the story is created as a <strong>Draft</strong>. You can edit nodes, submit for review, and publish from the Stories page.
          </Alert>
        </Box>
      </Collapse>
    </Box>
  )
}

// ── Log line ──────────────────────────────────────────────────────────────────

type LogKind = 'info' | 'ok' | 'error'
interface LogEntry { kind: LogKind; text: string }

function LogLine({ entry }: { entry: LogEntry }) {
  const icon = entry.kind === 'ok'
    ? <CheckCircleOutlineIcon fontSize="small" color="success" />
    : entry.kind === 'error'
      ? <ErrorOutlineIcon fontSize="small" color="error" />
      : <CircularProgress size={14} />
  return (
    <ListItem disablePadding sx={{ py: 0.25 }}>
      <ListItemIcon sx={{ minWidth: 28 }}>{icon}</ListItemIcon>
      <ListItemText primary={<Typography variant="caption">{entry.text}</Typography>} />
    </ListItem>
  )
}

// ── Main dialog ───────────────────────────────────────────────────────────────

const BATCH = 8

type Phase = 'upload' | 'importing' | 'done'

interface Props {
  open: boolean
  onClose: () => void
  categories: Category[]
  onImported?: (storyId: number) => void
}

export default function ImportStoryDialog({ open, onClose, categories, onImported }: Props) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<Phase>('upload')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [progress, setProgress] = useState(0)
  const [importedStoryId, setImportedStoryId] = useState<number | null>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log.length])

  function reset() {
    setPhase('upload')
    setDragging(false)
    setFileName(null)
    setValidation(null)
    setLog([])
    setProgress(0)
    setImportedStoryId(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleClose() {
    if (phase === 'importing') return
    reset()
    onClose()
  }

  function addLog(entry: LogEntry) {
    setLog((prev) => [...prev, entry])
  }

  function processFile(file: File) {
    if (!file.name.endsWith('.json')) {
      setValidation({ errors: ['File must have a .json extension.'], warnings: [], data: null })
      setFileName(file.name)
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string)
        setValidation(validate(parsed))
      } catch {
        setValidation({ errors: ['Invalid JSON — could not parse the file.'], warnings: [], data: null })
      }
    }
    reader.readAsText(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  async function runImport() {
    if (!validation?.data) return
    const d = validation.data
    setPhase('importing')
    setLog([])
    setProgress(0)

    const totalAnswers = d.nodes.reduce((s, n) => s + n.answers.length, 0)
    const totalCalls = 2 + d.nodes.length + totalAnswers
    let done = 0
    const tick = (n = 1) => { done += n; setProgress(Math.round((done / totalCalls) * 100)) }

    try {
      // 1. Create story — append a short random suffix so repeated imports never collide
      const rand = Math.random().toString(36).slice(2, 7)
      const titleSlug = d.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 74) + '-' + rand
      addLog({ kind: 'info', text: 'Creating story…' })
      const { data: story } = await adminService.createStory({
        title: d.title,
        slug: titleSlug,
        description: d.description ?? null,
        excerpt: d.excerpt ?? null,
        coverImageUrl: d.coverImageUrl ?? null,
        authorName: d.authorName ?? null,
        isFeatured: false,
        categoryId: d.categoryId,
        publishDate: null,
        isPublish: false,
        tagIds: [],
        savePath: titleSlug,
        content: d.content ?? null,
        wordCount: 0,
        scoreWeight: d.scoreWeight ?? 1,
      })
      tick()
      addLog({ kind: 'ok', text: `Story created (ID: ${story.id})` })

      // 2. Story detail (revision 1)
      addLog({ kind: 'info', text: 'Creating story revision…' })
      const { data: detail } = await adminService.addStoryDetail(story.id, {
        savePath: titleSlug,
        content: d.content ?? null,
        wordCount: 0,
        changeNotes: 'Imported from JSON',
        scoreWeight: d.scoreWeight ?? 1,
        isPublish: false,
      })
      tick()
      addLog({ kind: 'ok', text: `Revision 1 created (detail ID: ${detail.id})` })

      // 3. Nodes — sequential (the isStart handler does ExecuteUpdateAsync which takes a
      //    table-level lock; concurrent INSERTs on the same table cause deadlocks)
      const refToId: Record<string, number> = {}
      addLog({ kind: 'info', text: `Creating ${d.nodes.length} nodes…` })
      for (let i = 0; i < d.nodes.length; i++) {
        const n = d.nodes[i]
        const { data: node } = await adminService.upsertStoryNode({
          storyDetailId: detail.id,
          question: n.question,
          questionSubtitle: n.questionSubtitle ?? undefined,
          isStart: n.isStart ?? false,
          backgroundImageUrl: n.backgroundImageUrl ?? undefined,
          backgroundColor: n.backgroundColor ?? undefined,
          videoUrl: n.videoUrl ?? undefined,
          animationType: n.animationType ?? undefined,
          sortOrder: n.sortOrder ?? i,
        })
        refToId[n.ref] = node.id
        tick()
      }
      addLog({ kind: 'ok', text: `${d.nodes.length} nodes created` })

      // 4. Answers — batched parallel (all node IDs are known at this point)
      const allAnswers = d.nodes.flatMap((n) =>
        n.answers.map((a, j) => ({
          a, j,
          nodeId: refToId[n.ref],
          nextNodeId: a.nextNodeRef && a.nextNodeRef !== 'end' ? (refToId[a.nextNodeRef] ?? null) : null,
        }))
      )
      addLog({ kind: 'info', text: `Creating ${allAnswers.length} answers…` })
      for (let i = 0; i < allAnswers.length; i += BATCH) {
        const slice = allAnswers.slice(i, i + BATCH)
        await Promise.all(
          slice.map(({ a, j, nodeId, nextNodeId }) =>
            adminService.upsertStoryNodeAnswer({
              storyNodeId: nodeId,
              text: a.text,
              pointsAwarded: a.pointsAwarded ?? 0,
              scoreDeltas: a.scoreDeltas ?? undefined,
              branchWeights: {},
              nextNodeId,
              color: a.color ?? undefined,
              sortOrder: a.sortOrder ?? j + 1,
            })
          )
        )
        tick(slice.length)
      }
      addLog({ kind: 'ok', text: `${allAnswers.length} answers created` })

      setImportedStoryId(story.id)
      setProgress(100)
      setPhase('done')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      addLog({ kind: 'error', text: `Import failed: ${msg}` })
      setProgress(0)
    }
  }

  const nodeCount = validation?.data?.nodes.length ?? 0
  const answerCount = validation?.data?.nodes.reduce((s, n) => s + n.answers.length, 0) ?? 0
  const categoryName = categories.find((c) => c.id === validation?.data?.categoryId)?.title

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <UploadFileIcon color="primary" />
          Import Story from JSON
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {phase === 'upload' && (
          <>
            <GuideSection />

            {/* Drop zone */}
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: dragging ? 'primary.main' : validation?.errors?.length ? 'error.main' : validation?.data ? 'success.main' : 'divider',
                borderRadius: 2, p: 4, textAlign: 'center', cursor: 'pointer',
                bgcolor: dragging ? 'action.hover' : 'background.default',
                transition: 'all 0.15s ease',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <UploadFileIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" fontWeight={600}>
                {fileName ?? 'Drop a .json file here or click to browse'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Only .json files are accepted
              </Typography>
              <input ref={fileInputRef} type="file" accept=".json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
            </Box>

            {/* Validation errors */}
            {validation?.errors && validation.errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>Validation errors</Typography>
                {validation.errors.map((e, i) => <Typography key={i} variant="caption" display="block">• {e}</Typography>)}
              </Alert>
            )}

            {/* Warnings */}
            {validation?.warnings && validation.warnings.length > 0 && (
              <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ mt: 1 }}>
                {validation.warnings.map((w, i) => <Typography key={i} variant="caption" display="block">• {w}</Typography>)}
              </Alert>
            )}

            {/* Preview */}
            {validation?.data && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200', borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" gap={0.5} mb={1}>
                  <CheckCircleOutlineIcon fontSize="small" color="success" />
                  <Typography variant="body2" fontWeight={700} color="success.dark">Ready to import</Typography>
                </Stack>
                <Typography variant="body2"><strong>{validation.data.title}</strong></Typography>
                {categoryName && <Typography variant="caption" color="text.secondary">Category: {categoryName}</Typography>}
                <Stack direction="row" gap={1} mt={1}>
                  <Chip label={`${nodeCount} node${nodeCount !== 1 ? 's' : ''}`} size="small" color="primary" variant="outlined" />
                  <Chip label={`${answerCount} answer${answerCount !== 1 ? 's' : ''}`} size="small" variant="outlined" />
                  <Chip label={validation.data.storyType ?? 'Interactive'} size="small" variant="outlined" />
                </Stack>
              </Box>
            )}
          </>
        )}

        {phase === 'importing' && (
          <>
            <LinearProgress variant="determinate" value={progress} sx={{ mb: 2, borderRadius: 1 }} />
            <Typography variant="caption" color="text.secondary" mb={1} display="block">
              {progress}% complete
            </Typography>
            <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
              {log.map((entry, i) => <LogLine key={i} entry={entry} />)}
              <div ref={logEndRef} />
            </List>
          </>
        )}

        {phase === 'done' && (
          <Box textAlign="center" py={2}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56, mb: 1 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>Import complete!</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {nodeCount} nodes and {answerCount} answers were imported successfully.
              The story is saved as a <strong>Draft</strong> — edit and submit when ready.
            </Typography>
            <List dense disablePadding sx={{ textAlign: 'left', maxHeight: 180, overflowY: 'auto', mb: 2 }}>
              {log.map((entry, i) => <LogLine key={i} entry={entry} />)}
              <div ref={logEndRef} />
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Tooltip title="Download a complete example JSON file">
          <Button startIcon={<DownloadIcon />} size="small" onClick={downloadExample} color="inherit">
            Example JSON
          </Button>
        </Tooltip>

        <Box flex={1} />

        {phase === 'done' && importedStoryId != null && (
          <>
            <Button
              variant="outlined" startIcon={<TuneIcon />}
              onClick={() => { const id = importedStoryId; handleClose(); onImported?.(id) }}
            >
              Configure Story
            </Button>
            <Button
              variant="contained" startIcon={<AccountTreeIcon />}
              onClick={() => { handleClose(); navigate(`/stories/${importedStoryId}/nodes`) }}
            >
              Edit Nodes
            </Button>
          </>
        )}

        {phase !== 'done' && (
          <>
            <Button onClick={handleClose} disabled={phase === 'importing'}>Cancel</Button>
            {phase === 'upload' && (
              <Button
                variant="contained" startIcon={<UploadFileIcon />}
                disabled={!validation?.data}
                onClick={runImport}
              >
                Import
              </Button>
            )}
          </>
        )}

        {phase === 'done' && (
          <Button onClick={handleClose}>Close</Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
