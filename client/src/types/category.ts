export interface Category {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
  scoreWeight: number;
  scoreWeightHistory: number[];
  orderToShow: number;
  parentId: number | null;
  createdOn: string;
  modifiedOn: string | null;
  createdBy: string | null;
  modifiedBy: string | null;
  children: Category[];
}

export interface CategoryScoreType {
  id: number;
  name: string;
  label: string | null;
  scoreWeight: number;
  orderToShow: number;
}

export interface CategoryBadge {
  id: number;
  tier: number;
  label: string;
  labelVi: string | null;
  scoreThreshold: number;
  badgeImageUrl: string | null;
}

export interface UserCategoryBadge {
  badgeId: number;
  categoryId: number;
  categoryTitle: string;
  tier: number;
  label: string;
  labelVi: string | null;
  badgeImageUrl: string | null;
  awardedAt: string;
}
