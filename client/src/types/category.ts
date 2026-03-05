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
