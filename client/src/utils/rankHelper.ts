export const RANK_TIERS = [
  { name: 'Herald',   min: 0,     perStar: 100,  color: '#9e9e9e' },
  { name: 'Guardian', min: 500,   perStar: 150,  color: '#4caf50' },
  { name: 'Crusader', min: 1250,  perStar: 250,  color: '#29b6f6' },
  { name: 'Archon',   min: 2500,  perStar: 400,  color: '#26c6da' },
  { name: 'Legend',   min: 4500,  perStar: 600,  color: '#5c6bc0' },
  { name: 'Ancient',  min: 7500,  perStar: 1000, color: '#7e57c2' },
  { name: 'Divine',   min: 12500, perStar: 1500, color: '#ffd700' },
  { name: 'Immortal', min: 20000, perStar: 5000, color: '#ff5722' },
] as const;

export interface RankInfo {
  name: string;
  stars: number;
  color: string;
  nextAt: number;
  nextLabel: string;
  progressPct: number; // 0-100 within current star
}

export function getRank(allTimeCredits: number): RankInfo {
  let idx = RANK_TIERS.length - 1;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (allTimeCredits < RANK_TIERS[i].min) { idx = i - 1; break; }
  }
  if (idx < 0) idx = 0;

  const tier = RANK_TIERS[idx];
  const stars = Math.min(5, 1 + Math.floor((allTimeCredits - tier.min) / tier.perStar));
  const starBase = tier.min + (stars - 1) * tier.perStar;

  let nextAt: number;
  let nextLabel: string;
  if (stars < 5) {
    nextAt = tier.min + stars * tier.perStar;
    nextLabel = `${tier.name} ★${stars + 1}`;
  } else if (idx + 1 < RANK_TIERS.length) {
    nextAt = RANK_TIERS[idx + 1].min;
    nextLabel = `${RANK_TIERS[idx + 1].name} ★1`;
  } else {
    nextAt = allTimeCredits;
    nextLabel = 'Max Rank';
  }

  const progressPct = nextAt > starBase
    ? Math.round(((allTimeCredits - starBase) / (nextAt - starBase)) * 100)
    : 100;

  return { name: tier.name, stars, color: tier.color, nextAt, nextLabel, progressPct };
}
