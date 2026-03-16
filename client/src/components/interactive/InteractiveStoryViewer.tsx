import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, RotateCcw, Trophy } from 'lucide-react';
import { interactiveStoryApi } from '../../services/interactiveStoryApi';
import type { AnswerFeedback, CategoryScoreTypeDef, PlayerAnswer } from '../../types/storyNode';
import { playScoreSound } from '../../utils/audioUtils';
import {
  FEEDBACK_DISPLAY_MS,
  MILESTONE_DISPLAY_MS,
  SCORE_DELTA_DISPLAY_MS,
  SCORE_MILESTONE_INTERVAL,
} from '../../constants/storyViewerConstants';
import { ScoreDeltaNotification } from './ScoreDeltaNotification';
import { FlyingScoreParticle } from './FlyingScoreParticle';
import type { FlyingParticle } from './FlyingScoreParticle';
import { ScoreChip } from './ScoreChip';
import { StoryScene } from './StoryScene';
import { AnswerPanel } from './AnswerPanel';
import { IntroScreen } from './IntroScreen';
import { CompletionScreen } from './CompletionScreen';

interface InteractiveStoryViewerProps {
  storyId: number;
  storyTitle: string;
  onClose: () => void;
}

export function InteractiveStoryViewer({ storyId, storyTitle, onClose }: InteractiveStoryViewerProps) {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [slideKey, setSlideKey] = useState(0);
  const [activeFeedback, setActiveFeedback] = useState<AnswerFeedback | null>(null);
  const [introSkipped, setIntroSkipped] = useState(false);
  const [milestone, setMilestone] = useState<{ label: string; positive: boolean } | null>(null);
  const [scoreDeltas, setScoreDeltas] = useState<Record<string, number>>({});
  const [flyingParticles, setFlyingParticles] = useState<FlyingParticle[]>([]);
  const [confirmMode, setConfirmMode] = useState(
    () => localStorage.getItem('story-confirm-mode') === 'true'
  );

  const chipRefs          = useRef<Record<string, HTMLDivElement | null>>({});
  const lastAnswerRectRef = useRef<DOMRect | null>(null);

  const { data: state, isLoading, isError, refetch } = useQuery({
    queryKey: ['interactive-story', storyId],
    queryFn:  () => interactiveStoryApi.startOrResume(storyId),
    retry: false,
  });

  const { mutate: submitAnswer, isPending } = useMutation({
    mutationFn: ({ progressId, answerId }: { progressId: number; answerId: number }) =>
      interactiveStoryApi.submitAnswer(progressId, answerId),
    onSuccess: (newState) => {
      const prevState = queryClient.getQueryData<typeof newState>(['interactive-story', storyId]);
      queryClient.setQueryData(['interactive-story', storyId], newState);
      setSlideKey((k) => k + 1);

      if (newState.lastAnswerFeedback) {
        setActiveFeedback(newState.lastAnswerFeedback);
        setScoreDeltas(newState.lastAnswerFeedback.scoreDeltas ?? {});
        playScoreSound((newState.lastAnswerFeedback.totalDelta ?? 0) >= 0);
        spawnFlyingParticles(newState.lastAnswerFeedback.scoreDeltas ?? {});
      }

      if (prevState) checkMilestones(prevState.scoreTotals, newState.scoreTotals, newState.scoreTypeDefinitions);
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
    },
  });

  useEffect(() => {
    if (!activeFeedback) return;
    const t = setTimeout(() => setActiveFeedback(null), FEEDBACK_DISPLAY_MS);
    return () => clearTimeout(t);
  }, [activeFeedback]);

  useEffect(() => {
    if (!milestone) return;
    const t = setTimeout(() => setMilestone(null), MILESTONE_DISPLAY_MS);
    return () => clearTimeout(t);
  }, [milestone]);

  useEffect(() => {
    if (Object.keys(scoreDeltas).length === 0) return;
    const t = setTimeout(() => setScoreDeltas({}), SCORE_DELTA_DISPLAY_MS);
    return () => clearTimeout(t);
  }, [scoreDeltas]);

  function toggleConfirmMode() {
    setConfirmMode((v) => {
      localStorage.setItem('story-confirm-mode', String(!v));
      return !v;
    });
  }

  function spawnFlyingParticles(deltas: Record<string, number>) {
    const srcRect = lastAnswerRectRef.current;
    if (!srcRect) return;
    const srcX = srcRect.left + srcRect.width / 2;
    const srcY = srcRect.top  + srcRect.height / 2;
    const particles: FlyingParticle[] = [];

    for (const [name, delta] of Object.entries(deltas)) {
      if (delta === 0) continue;
      const chipEl = chipRefs.current[name];
      if (!chipEl) continue;
      const chipRect = chipEl.getBoundingClientRect();
      particles.push({
        id:    Date.now() * 100 + Math.random() * 99,
        value: delta,
        x: srcX - 14, y: srcY - 10,
        ex: chipRect.left + chipRect.width  / 2 - 14,
        ey: chipRect.top  + chipRect.height / 2 - 10,
        color: delta > 0 ? '#4ade80' : '#f87171',
      });
    }
    if (particles.length > 0) setFlyingParticles((prev) => [...prev, ...particles]);
  }

  function checkMilestones(
    prevTotals: Record<string, number>,
    currTotals: Record<string, number>,
    scoreTypes: CategoryScoreTypeDef[]
  ) {
    for (const st of scoreTypes) {
      const prev = Math.abs(prevTotals[st.name] ?? 0);
      const curr = Math.abs(currTotals[st.name] ?? 0);
      if (curr >= SCORE_MILESTONE_INTERVAL && Math.floor(curr / SCORE_MILESTONE_INTERVAL) > Math.floor(prev / SCORE_MILESTONE_INTERVAL)) {
        setMilestone({ label: st.label ?? st.name, positive: (currTotals[st.name] ?? 0) > 0 });
        break;
      }
    }
  }

  const scoreTypes = state?.scoreTypeDefinitions ?? [];
  const showIntro  = !introSkipped && state !== undefined && state.visitedNodeCount === 0;
  const animClass  =
    state?.currentNode?.animationType === 'slide-left' ? 'isv-slide'
      : state?.currentNode?.animationType === 'zoom' ? 'isv-zoom'
        : 'isv-fade';

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#080c14' }}>
      <style>{`
        @keyframes isv-fade    { from { opacity:0 }                                      to { opacity:1 } }
        @keyframes isv-slide   { from { opacity:0; transform:translateX(32px) }          to { opacity:1; transform:translateX(0) } }
        @keyframes isv-zoom    { from { opacity:0; transform:scale(0.96) }               to { opacity:1; transform:scale(1) } }
        @keyframes delta-drop  { from { opacity:0; transform:translateY(-6px) }          to { opacity:1; transform:translateY(0) } }
        @keyframes ken-burns   { 0% { transform:scale(1) translate(0,0) }                100% { transform:scale(1.12) translate(-2%, 1%) } }
        @keyframes answer-in   { from { opacity:0; transform:translateY(10px) }          to { opacity:1; transform:translateY(0) } }
        @keyframes orb-float   { 0%,100% { transform:translateY(0) scale(1) }            50% { transform:translateY(-20px) scale(1.06) } }
        @keyframes blink       { 0%,100% { opacity:1 }                                   50% { opacity:0 } }
        @keyframes ripple-out  { from { transform:scale(0); opacity:0.6 }                to { transform:scale(4); opacity:0 } }
        @keyframes milestone-pop { 0% { opacity:0; transform:translateY(8px) scale(0.92) } 15% { opacity:1; transform:translateY(0) scale(1) } 80% { opacity:1 } 100% { opacity:0 } }
        @keyframes btn-pulse   { 0%,100% { box-shadow:0 0 22px rgba(99,102,241,0.45),0 4px 20px rgba(0,0,0,0.5) }
                                 50%     { box-shadow:0 0 44px rgba(99,102,241,0.8),0 4px 20px rgba(0,0,0,0.5) } }
        @keyframes score-delta { 0%   { opacity:0; transform:translateX(-50%) translateY(2px) scale(0.75) }
                                 18%  { opacity:1; transform:translateX(-50%) translateY(-6px) scale(1.15) }
                                 65%  { opacity:1; transform:translateX(-50%) translateY(-18px) scale(1) }
                                 100% { opacity:0; transform:translateX(-50%) translateY(-28px) scale(0.85) } }
        @keyframes chip-flash  { 0%,100% { box-shadow:none }
                                 35%     { box-shadow:0 0 0 2px var(--flash), 0 0 16px var(--flash) } }
        .isv-fade   { animation: isv-fade  0.45s cubic-bezier(.4,0,.2,1) both }
        .isv-slide  { animation: isv-slide 0.45s cubic-bezier(.4,0,.2,1) both }
        .isv-zoom   { animation: isv-zoom  0.45s cubic-bezier(.4,0,.2,1) both }
        .adventure-btn { animation: btn-pulse 2.4s ease-in-out infinite }
        .blink-cursor { animation: blink 1s ease infinite }
      `}</style>

      {/* Left sidebar — reserved for future ads */}
      <div className="hidden xl:flex xl:flex-1" />

      {/* Center story column */}
      <div className="relative flex w-full flex-col overflow-hidden xl:w-2/3" style={{ background: '#080c14' }}>

        {/* Top bar */}
        <div
          className="flex flex-shrink-0 items-center gap-4 px-4"
          style={{ background: '#080c14', borderBottom: '1px solid rgba(255,255,255,0.07)', minHeight: '64px' }}
        >
          <button
            onClick={onClose}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Back to story"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <span className="min-w-0 flex-1 truncate text-base font-bold text-white/80">{storyTitle}</span>

          {scoreTypes.length > 0 && !showIntro && (
            <div className="flex flex-shrink-0 items-center gap-2">
              {scoreTypes.map((st) => (
                <div key={st.name} ref={(el) => { chipRefs.current[st.name] = el; }}>
                  <ScoreChip
                    label={st.label ?? st.name}
                    value={state?.scoreTotals[st.name] ?? 0}
                    delta={scoreDeltas[st.name]}
                  />
                </div>
              ))}
            </div>
          )}

          {!showIntro && (
            <button
              onClick={toggleConfirmMode}
              title={confirmMode ? 'Disable confirm-before-submit' : 'Require confirming answer before submit'}
              className="flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200"
              style={{
                background: confirmMode ? 'rgba(99,102,241,0.22)' : 'rgba(255,255,255,0.07)',
                border: `1.5px solid ${confirmMode ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.13)'}`,
                boxShadow: confirmMode ? '0 0 12px rgba(99,102,241,0.25)' : 'none',
              }}
            >
              <span className="relative flex-shrink-0 rounded-full transition-all duration-200" style={{ width: '30px', height: '17px', background: confirmMode ? '#6366f1' : 'rgba(255,255,255,0.15)' }}>
                <span className="absolute top-[2px] rounded-full bg-white transition-all duration-200" style={{ width: '13px', height: '13px', left: confirmMode ? '15px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
              </span>
              <span className="text-xs font-semibold leading-none" style={{ color: confirmMode ? '#c7d2fe' : 'rgba(255,255,255,0.5)' }}>
                Confirm
              </span>
              <span className="hidden text-[10px] font-bold sm:inline" style={{ color: confirmMode ? '#a5b4fc' : 'rgba(255,255,255,0.25)' }}>
                {confirmMode ? 'ON' : 'OFF'}
              </span>
            </button>
          )}
        </div>

        {/* Progress bar */}
        {state && !state.isCompleted && !showIntro && (
          <div className="h-1 flex-shrink-0 bg-white/10">
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (state.visitedNodeCount / Math.max(state.visitedNodeCount + 3, 6)) * 100)}%`,
                background: 'linear-gradient(90deg, #818cf8, #a78bfa)',
              }}
            />
          </div>
        )}

        {activeFeedback && !showIntro && (
          <ScoreDeltaNotification feedback={activeFeedback} scoreTypeDefinitions={scoreTypes} lang={lang} />
        )}

        {isLoading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-base text-white/40">Loading story…</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-base text-white/50">Failed to load the story. Please try again.</p>
            <button onClick={() => refetch()} className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/15">
              <RotateCcw className="h-4 w-4" /> Retry
            </button>
          </div>
        )}

        {state?.isCompleted && (
          <CompletionScreen
            totalPointsEarned={state.totalPointsEarned}
            storyTitle={storyTitle}
            scoreTotals={state.scoreTotals}
            scoreTypeDefinitions={state.scoreTypeDefinitions}
            onClose={onClose}
            storyId={storyId}
          />
        )}

        {showIntro && state.currentNode && (
          <IntroScreen
            storyTitle={storyTitle}
            backgroundImageUrl={state.currentNode.backgroundImageUrl}
            backgroundColor={state.currentNode.backgroundColor}
            onBegin={() => setIntroSkipped(true)}
          />
        )}

        {state && !state.isCompleted && state.currentNode && !showIntro && (
          <div key={`${state.currentNode.id}-${slideKey}`} className={`relative flex flex-1 flex-col overflow-hidden ${animClass}`}>
            <StoryScene node={state.currentNode} lang={lang} />

            {milestone && (
              <div className="pointer-events-none absolute inset-x-0 bottom-[210px] z-40 flex justify-center px-4">
                <div
                  className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-xl"
                  style={{
                    background: milestone.positive ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                    border: `1px solid ${milestone.positive ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)'}`,
                    color: milestone.positive ? '#4ade80' : '#f87171',
                    backdropFilter: 'blur(10px)',
                    animation: 'milestone-pop 2.5s cubic-bezier(.4,0,.2,1) both',
                  }}
                >
                  <Trophy className="h-4 w-4" />
                  {milestone.label} milestone!
                </div>
              </div>
            )}

            <AnswerPanel
              node={state.currentNode}
              onAnswer={(answer, rect) => {
                lastAnswerRectRef.current = rect;
                submitAnswer({ progressId: state.progressId, answerId: answer.id });
              }}
              submitting={isPending}
              confirmMode={confirmMode}
              lang={lang}
            />
          </div>
        )}
      </div>

      {/* Right sidebar — reserved for future ads */}
      <div className="hidden xl:flex xl:flex-1" />

      {/* Flying score particles (fixed overlay) */}
      {flyingParticles.map((p) => (
        <FlyingScoreParticle
          key={p.id}
          item={p}
          onDone={() => setFlyingParticles((prev) => prev.filter((x) => x.id !== p.id))}
        />
      ))}
    </div>
  );
}
