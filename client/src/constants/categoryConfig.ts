import { BookOpen, Brain, Cpu, Leaf, Sparkles, TrendingUp } from 'lucide-react';

export interface CategoryDisplayConfig {
  icon: typeof BookOpen;
  from: string;
  to: string;
  emoji: string;
}

/** Display config for known category titles, keyed by seeder name. */
export const CATEGORY_CONFIG: Record<string, CategoryDisplayConfig> = {
  'Finance':          { icon: TrendingUp, from: '#064e3b', to: '#065f46', emoji: '💰' },
  'Real Life':        { icon: Leaf,       from: '#1e3a5f', to: '#1e40af', emoji: '🌿' },
  'Fiction':          { icon: Sparkles,   from: '#3b0764', to: '#581c87', emoji: '✨' },
  'Technology':       { icon: Cpu,        from: '#0c4a6e', to: '#075985', emoji: '⚡' },
  'Self Improvement': { icon: Brain,      from: '#431407', to: '#7c2d12', emoji: '🧠' },
};

export const FALLBACK_CATEGORY_CONFIG: CategoryDisplayConfig = {
  icon: BookOpen, from: '#1e1b4b', to: '#312e81', emoji: '📖',
};

/** Returns [from, to] gradient pair for a category title. */
export function getCategoryGradient(title: string): [string, string] {
  const cfg = CATEGORY_CONFIG[title] ?? FALLBACK_CATEGORY_CONFIG;
  return [cfg.from, cfg.to];
}
