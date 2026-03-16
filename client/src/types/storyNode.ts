// ── Player-facing types (scores hidden) ──────────────────────────────────────

export interface PlayerAnswer {
  id: number;
  text: string;
  textVi: string | null;
  color: string | null;
  sortOrder: number;
  hasBranching: boolean;
}

export interface PlayerStoryNode {
  id: number;
  storyDetailId: number;
  question: string;
  questionSubtitle: string | null;
  questionVi: string | null;
  questionSubtitleVi: string | null;
  isStart: boolean;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  videoUrl: string | null;
  animationType: string | null;
  sortOrder: number;
  answers: PlayerAnswer[];
}

export interface AnswerFeedback {
  answerId: number;
  scoreDeltas: Record<string, number>;
  totalDelta: number;
  feedback: string | null;
  feedbackVi: string | null;
  choiceCount: number;
  totalChoices: number;
}

export interface CategoryScoreTypeDef {
  id: number;
  name: string;
  label: string | null;
  scoreWeight: number;
  orderToShow: number;
}

export interface InteractiveStoryState {
  progressId: number;
  storyId: number;
  storyDetailId: number;
  isCompleted: boolean;
  totalPointsEarned: number;
  scoreTotals: Record<string, number>;
  scoreTypeDefinitions: CategoryScoreTypeDef[];
  currentNode: PlayerStoryNode | null;
  visitedNodeCount: number;
  lastAnswerFeedback: AnswerFeedback | null;
}

// ── Admin-facing types (all fields) ──────────────────────────────────────────

export interface StoryNodeAnswer {
  id: number;
  text: string;
  textVi: string | null;
  pointsAwarded: number;
  scoreDeltas: Record<string, number>;
  nextNodeId: number | null;
  branchWeights: Record<string, number>;
  feedback: string | null;
  feedbackVi: string | null;
  color: string | null;
  sortOrder: number;
}

export interface StoryNode {
  id: number;
  storyDetailId: number;
  question: string;
  questionSubtitle: string | null;
  questionVi: string | null;
  questionSubtitleVi: string | null;
  isStart: boolean;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  videoUrl: string | null;
  animationType: string | null;
  sortOrder: number;
  answers: StoryNodeAnswer[];
}
