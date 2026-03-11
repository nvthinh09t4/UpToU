import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Coins, ChevronRight, Sparkles, Trophy, Loader2, RotateCcw } from 'lucide-react';
import { interactiveStoryApi } from '../../services/interactiveStoryApi';
import type { StoryNode, StoryNodeAnswer } from '../../types/storyNode';

interface InteractiveStoryViewerProps {
  storyId: number;
  storyTitle: string;
  onClose: () => void;
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m ? m[1] : null;
}

// ── Scene — top immersive area ────────────────────────────────────────────────

function Scene({ node }: { node: StoryNode }) {
  const ytId = node.videoUrl ? getYouTubeId(node.videoUrl) : null;

  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{
        backgroundColor: node.backgroundColor ?? '#0f172a',
        backgroundImage: node.backgroundImageUrl
          ? `url(${node.backgroundImageUrl})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Vignette: dark at edges, gradient to bottom for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

      {/* Video embed */}
      {ytId ? (
        <div className="absolute inset-x-0 top-1/2 z-10 mx-auto w-full max-w-md -translate-y-1/2 overflow-hidden rounded-xl shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0`}
            title="video"
            className="aspect-video w-full"
            allowFullScreen
          />
        </div>
      ) : node.videoUrl ? (
        <div className="absolute inset-x-0 top-1/2 z-10 mx-auto w-full max-w-md -translate-y-1/2 overflow-hidden rounded-xl shadow-2xl">
          <video src={node.videoUrl} controls className="aspect-video w-full" />
        </div>
      ) : null}

      {/* Question text anchored to bottom of scene */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-7 pt-16">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-white/50">
          Your situation
        </p>
        <h2
          className="text-xl font-bold leading-snug text-white drop-shadow-lg sm:text-2xl"
          style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
        >
          {node.question}
        </h2>
        {node.questionSubtitle && (
          <p className="mt-2 text-sm italic text-white/65" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
            {node.questionSubtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Answer panel — bottom glass card ─────────────────────────────────────────

function AnswerPanel({
  node,
  onAnswer,
  submitting,
}: {
  node: StoryNode;
  onAnswer: (a: StoryNodeAnswer) => void;
  submitting: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div
      className="flex flex-shrink-0 flex-col gap-2 px-4 pb-5 pt-4"
      style={{
        background: 'linear-gradient(to bottom, rgba(10,12,20,0.96), rgba(5,7,14,0.99))',
        backdropFilter: 'blur(16px)',
      }}
    >
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35">
        What do you do?
      </p>

      {node.answers.map((answer, idx) => {
        const accent = answer.color ?? '#6366f1';
        const isHovered = hoveredId === answer.id;

        return (
          <button
            key={answer.id}
            onClick={() => !submitting && onAnswer(answer)}
            onMouseEnter={() => setHoveredId(answer.id)}
            onMouseLeave={() => setHoveredId(null)}
            disabled={submitting}
            className="group relative flex w-full items-center gap-3 overflow-hidden rounded-lg text-left transition-all duration-200 disabled:pointer-events-none disabled:opacity-40"
            style={{
              background: isHovered
                ? 'rgba(255,255,255,0.09)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isHovered ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
              transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
              boxShadow: isHovered ? `0 0 0 1px ${accent}44, inset 3px 0 0 ${accent}` : `inset 3px 0 0 ${accent}66`,
              padding: '10px 14px',
            }}
          >
            {/* Index badge */}
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold transition-colors"
              style={{
                background: isHovered ? accent : `${accent}33`,
                color: isHovered ? '#fff' : accent,
              }}
            >
              {idx + 1}
            </span>

            {/* Answer text */}
            <span className="flex-1 text-sm font-medium leading-snug text-white/85 group-hover:text-white">
              {answer.text}
            </span>

            {/* Right side */}
            <div className="flex flex-shrink-0 items-center gap-2">
              {answer.pointsAwarded > 0 && (
                <span
                  className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
                >
                  <Coins className="h-3 w-3" />
                  +{answer.pointsAwarded}
                </span>
              )}
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
              ) : (
                <ChevronRight
                  className="h-3.5 w-3.5 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-white/60"
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Completion screen ─────────────────────────────────────────────────────────

function CompletionScreen({
  totalPointsEarned,
  storyTitle,
  onClose,
}: {
  totalPointsEarned: number;
  storyTitle: string;
  onClose: () => void;
}) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-6 py-12 text-center"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #1e1b4b 0%, #0a0a12 70%)',
        animation: 'isv-fade 0.6s ease both',
      }}
    >
      {/* Glow ring */}
      <div className="relative mb-6">
        <div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{ background: 'rgba(251,191,36,0.25)', transform: 'scale(1.5)' }}
        />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-400/40">
          <Trophy className="h-9 w-9 text-amber-400" />
        </div>
      </div>

      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/40">
        Story complete
      </p>
      <h2 className="mb-1 text-2xl font-bold text-white">{storyTitle}</h2>
      <p className="mb-8 text-sm text-white/50">Your choices shaped this story.</p>

      {totalPointsEarned > 0 && (
        <div
          className="mb-8 flex items-center gap-4 rounded-2xl px-8 py-5"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}
        >
          <Sparkles className="h-7 w-7 text-amber-400" />
          <div className="text-left">
            <p className="text-xs text-amber-400/70">Credits earned</p>
            <p className="text-3xl font-extrabold text-amber-400">
              +{totalPointsEarned.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="rounded-xl px-10 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' }}
      >
        Back to Story
      </button>
    </div>
  );
}

// ── Main viewer ───────────────────────────────────────────────────────────────

export function InteractiveStoryViewer({ storyId, storyTitle, onClose }: InteractiveStoryViewerProps) {
  const queryClient = useQueryClient();
  const [slideKey, setSlideKey] = useState(0);

  const { data: state, isLoading, isError, refetch } = useQuery({
    queryKey: ['interactive-story', storyId],
    queryFn: () => interactiveStoryApi.startOrResume(storyId),
    retry: false,
  });

  const { mutate: submitAnswer, isPending } = useMutation({
    mutationFn: ({ progressId, answerId }: { progressId: number; answerId: number }) =>
      interactiveStoryApi.submitAnswer(progressId, answerId),
    onSuccess: (newState) => {
      queryClient.setQueryData(['interactive-story', storyId], newState);
      setSlideKey((k) => k + 1);
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
    },
  });

  // Animate each new slide
  const animClass =
    state?.currentNode?.animationType === 'slide-left'
      ? 'isv-slide'
      : state?.currentNode?.animationType === 'zoom'
        ? 'isv-zoom'
        : 'isv-fade';

  return (
    <>
      <style>{`
        @keyframes isv-fade   { from { opacity:0 }                                    to { opacity:1 } }
        @keyframes isv-slide  { from { opacity:0; transform:translateX(32px) }        to { opacity:1; transform:translateX(0) } }
        @keyframes isv-zoom   { from { opacity:0; transform:scale(0.96) }             to { opacity:1; transform:scale(1) } }
        .isv-fade  { animation: isv-fade  0.45s cubic-bezier(.4,0,.2,1) both }
        .isv-slide { animation: isv-slide 0.45s cubic-bezier(.4,0,.2,1) both }
        .isv-zoom  { animation: isv-zoom  0.45s cubic-bezier(.4,0,.2,1) both }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
        style={{ background: 'rgba(0,0,0,0.88)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Card */}
        <div
          className="relative flex w-full flex-col overflow-hidden shadow-2xl sm:max-w-lg sm:rounded-2xl"
          style={{
            height: '92dvh',
            maxHeight: '780px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* ── Top bar: progress + close ── */}
          <div
            className="absolute left-0 right-0 top-0 z-30 flex h-10 items-center justify-between px-3"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}
          >
            {/* Step counter */}
            <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white/60 backdrop-blur-sm">
              {storyTitle}
            </span>

            {/* Close */}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm transition hover:bg-black/70 hover:text-white"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── Progress bar ── */}
          {state && !state.isCompleted && (
            <div className="absolute left-0 right-0 top-0 z-40 h-0.5 bg-white/10">
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, ((state.visitedNodeCount) / Math.max(state.visitedNodeCount + 3, 6)) * 100)}%`,
                  background: 'linear-gradient(90deg, #818cf8, #a78bfa)',
                }}
              />
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div
              className="flex h-full flex-col items-center justify-center gap-3"
              style={{ background: '#080c14' }}
            >
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <p className="text-sm text-white/40">Loading story…</p>
            </div>
          )}

          {/* ── Error ── */}
          {isError && (
            <div
              className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center"
              style={{ background: '#080c14' }}
            >
              <p className="text-sm text-white/50">Failed to load the story. Please try again.</p>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/15"
              >
                <RotateCcw className="h-4 w-4" /> Retry
              </button>
            </div>
          )}

          {/* ── Completion ── */}
          {state?.isCompleted && (
            <CompletionScreen
              totalPointsEarned={state.totalPointsEarned}
              storyTitle={storyTitle}
              onClose={onClose}
            />
          )}

          {/* ── Active slide ── */}
          {state && !state.isCompleted && state.currentNode && (
            <div
              key={`${state.currentNode.id}-${slideKey}`}
              className={`flex h-full flex-col ${animClass}`}
            >
              {/* Scene — takes remaining vertical space */}
              <Scene node={state.currentNode} />

              {/* Answer panel */}
              <AnswerPanel
                node={state.currentNode}
                submitting={isPending}
                onAnswer={(answer) =>
                  submitAnswer({ progressId: state.progressId, answerId: answer.id })
                }
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
