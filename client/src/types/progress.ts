export interface CategoryCredit {
  categoryId: number
  categoryTitle: string
  creditsEarned: number
}

export interface DailyCredit {
  date: string
  creditsEarned: number
}

export interface InProgressStory {
  storyId: number
  title: string
  categoryTitle: string
  coverImageUrl: string | null
  visitedNodes: number
  totalNodes: number
  pointsEarned: number
  startedAt: string
  updatedAt: string
}

export interface SuggestedStory {
  id: number
  title: string
  categoryTitle: string
  coverImageUrl: string | null
  viewCount: number
}

export interface UserProgress {
  categoryCredits: CategoryCredit[]
  dailyCredits: DailyCredit[]
  inProgressStories: InProgressStory[]
  suggestedStories: SuggestedStory[]
  trendingStories: SuggestedStory[]
  totalStarted: number
  totalCompleted: number
}
