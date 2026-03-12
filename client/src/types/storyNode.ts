export interface StoryNodeAnswer {
  id: number;
  text: string;
  pointsAwarded: number;
  nextNodeId: number | null;
  color: string | null;
  sortOrder: number;
}

export interface StoryNode {
  id: number;
  storyDetailId: number;
  question: string;
  questionSubtitle: string | null;
  isStart: boolean;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  videoUrl: string | null;
  animationType: string | null;
  sortOrder: number;
  answers: StoryNodeAnswer[];
}

export interface InteractiveStoryState {
  progressId: number;
  storyId: number;
  storyDetailId: number;
  isCompleted: boolean;
  totalPointsEarned: number;
  currentNode: StoryNode | null;
  visitedNodeCount: number;
}
