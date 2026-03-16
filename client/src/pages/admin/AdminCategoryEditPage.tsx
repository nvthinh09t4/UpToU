import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { categoryApi } from '../../services/categoryApi';
import type { CategoryBadge, CategoryScoreType } from '../../types/category';

// ── Category form ─────────────────────────────────────────────────────────────

interface CategoryFields {
  title: string;
  description: string;
  isActive: boolean;
  scoreWeight: number;
  orderToShow: number;
}

// ── Score type row form ───────────────────────────────────────────────────────

interface ScoreTypeFields {
  id?: number;
  name: string;
  label: string;
  scoreWeight: number;
  orderToShow: number;
}

const EMPTY_SCORE_TYPE: ScoreTypeFields = { name: '', label: '', scoreWeight: 1, orderToShow: 0 };

// ── Badge row form ────────────────────────────────────────────────────────────

interface BadgeFields {
  id?: number;
  tier: number;
  label: string;
  labelVi: string;
  scoreThreshold: number;
  badgeImageUrl: string;
}

const TIERS = [1, 2, 3, 4, 5] as const;
const TIER_NAMES: Record<number, string> = {
  1: 'Apprentice',
  2: 'Practitioner',
  3: 'Expert',
  4: 'Master',
  5: 'Grandmaster',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function FormInput({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-white/60">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none';

// ── Main page ─────────────────────────────────────────────────────────────────

export function AdminCategoryEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const categoryId = isNew ? null : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Category query ──────────────────────────────────────────────────────────

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoryApi.admin.getAll,
    enabled: !isNew,
  });
  const category = categories?.find((c) => c.id === categoryId);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CategoryFields>({
    values: category
      ? {
          title: category.title,
          description: category.description ?? '',
          isActive: category.isActive,
          scoreWeight: category.scoreWeight,
          orderToShow: category.orderToShow,
        }
      : { title: '', description: '', isActive: true, scoreWeight: 1, orderToShow: 0 },
  });

  const saveCategoryMutation = useMutation({
    mutationFn: (data: CategoryFields) =>
      isNew
        ? categoryApi.admin.create({ ...data, isActive: data.isActive })
        : categoryApi.admin.update(categoryId!, { ...data, isActive: data.isActive }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      if (isNew) navigate(`/admin/categories/${saved.id}`, { replace: true });
    },
  });

  const onSaveCategory = handleSubmit((data) => saveCategoryMutation.mutate(data));

  // ── Score types ─────────────────────────────────────────────────────────────

  const { data: scoreTypes, isLoading: stLoading } = useQuery({
    queryKey: ['admin-score-types', categoryId],
    queryFn: () => categoryApi.admin.getScoreTypes(categoryId!),
    enabled: !isNew && categoryId !== null,
  });

  const [editingScoreType, setEditingScoreType] = useState<ScoreTypeFields | null>(null);

  const upsertScoreTypeMutation = useMutation({
    mutationFn: (data: ScoreTypeFields) =>
      categoryApi.admin.upsertScoreType(categoryId!, {
        id: data.id,
        name: data.name,
        label: data.label || undefined,
        scoreWeight: data.scoreWeight,
        orderToShow: data.orderToShow,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-score-types', categoryId] });
      setEditingScoreType(null);
    },
  });

  const deleteScoreTypeMutation = useMutation({
    mutationFn: (scoreTypeId: number) => categoryApi.admin.deleteScoreType(scoreTypeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-score-types', categoryId] }),
  });

  // ── Badges ──────────────────────────────────────────────────────────────────

  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['admin-badges', categoryId],
    queryFn: () => categoryApi.admin.getBadges(categoryId!),
    enabled: !isNew && categoryId !== null,
  });

  const upsertBadgeMutation = useMutation({
    mutationFn: (data: BadgeFields) =>
      categoryApi.admin.upsertBadge(categoryId!, {
        id: data.id,
        tier: data.tier,
        label: data.label,
        labelVi: data.labelVi || undefined,
        scoreThreshold: data.scoreThreshold,
        badgeImageUrl: data.badgeImageUrl || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-badges', categoryId] }),
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: (badgeId: number) => categoryApi.admin.deleteBadge(badgeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-badges', categoryId] }),
  });

  // ── Badge row helpers ───────────────────────────────────────────────────────

  const badgeByTier = (tier: number): CategoryBadge | undefined =>
    badges?.find((b) => b.tier === tier);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/categories')}
            className="rounded-lg p-2 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">{isNew ? 'New Category' : 'Edit Category'}</h1>
        </div>

        {/* ── Section 1: Category fields ───────────────────────────────────── */}
        <section className="rounded-xl border border-white/10 bg-white/3 p-6">
          <h2 className="mb-4 text-lg font-semibold">Category</h2>
          <form onSubmit={onSaveCategory} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Title" error={errors.title?.message}>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className={inputCls}
                  placeholder="e.g. Investment"
                />
              </FormInput>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="Score Weight" error={errors.scoreWeight?.message}>
                  <input
                    {...register('scoreWeight', { valueAsNumber: true, min: 0 })}
                    type="number"
                    step="0.1"
                    className={inputCls}
                  />
                </FormInput>
                <FormInput label="Order" error={errors.orderToShow?.message}>
                  <input
                    {...register('orderToShow', { valueAsNumber: true })}
                    type="number"
                    className={inputCls}
                  />
                </FormInput>
              </div>
            </div>
            <FormInput label="Description">
              <textarea
                {...register('description')}
                rows={2}
                className={inputCls}
                placeholder="Optional description"
              />
            </FormInput>
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  {...register('isActive')}
                  type="checkbox"
                  className="h-4 w-4 accent-indigo-500"
                />
                <span>Active</span>
              </label>
              <button
                type="submit"
                disabled={!isDirty || saveCategoryMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-40"
              >
                {saveCategoryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </button>
            </div>
          </form>
        </section>

        {/* ── Section 2: Score Types (only shown after category is saved) ───── */}
        {!isNew && (
          <section className="rounded-xl border border-white/10 bg-white/3 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Score Types</h2>
              <button
                onClick={() => setEditingScoreType(EMPTY_SCORE_TYPE)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600/80 px-3 py-1.5 text-sm font-medium hover:bg-indigo-600"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            {stLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="space-y-2">
                {scoreTypes?.map((st) => (
                  <ScoreTypeRow
                    key={st.id}
                    scoreType={st}
                    isEditing={editingScoreType?.id === st.id}
                    isSaving={upsertScoreTypeMutation.isPending}
                    isDeleting={deleteScoreTypeMutation.isPending}
                    onEdit={() =>
                      setEditingScoreType({
                        id: st.id,
                        name: st.name,
                        label: st.label ?? '',
                        scoreWeight: st.scoreWeight,
                        orderToShow: st.orderToShow,
                      })
                    }
                    onCancel={() => setEditingScoreType(null)}
                    onSave={(data) => upsertScoreTypeMutation.mutate(data)}
                    onDelete={() => deleteScoreTypeMutation.mutate(st.id)}
                  />
                ))}

                {/* New row */}
                {editingScoreType && !editingScoreType.id && (
                  <ScoreTypeInlineForm
                    initial={editingScoreType}
                    isSaving={upsertScoreTypeMutation.isPending}
                    onSave={(data) => upsertScoreTypeMutation.mutate(data)}
                    onCancel={() => setEditingScoreType(null)}
                  />
                )}

                {!scoreTypes?.length && !editingScoreType && (
                  <p className="py-4 text-center text-sm text-white/30">
                    No score types yet. Add one above.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Section 3: Badges ─────────────────────────────────────────────── */}
        {!isNew && (
          <section className="rounded-xl border border-white/10 bg-white/3 p-6">
            <h2 className="mb-4 text-lg font-semibold">Badge Tiers</h2>

            {badgesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {TIERS.map((tier) => (
                  <BadgeTierRow
                    key={tier}
                    tier={tier}
                    badge={badgeByTier(tier)}
                    isSaving={upsertBadgeMutation.isPending}
                    isDeleting={deleteBadgeMutation.isPending}
                    onSave={(data) => upsertBadgeMutation.mutate(data)}
                    onDelete={(badgeId) => deleteBadgeMutation.mutate(badgeId)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ── ScoreTypeRow ──────────────────────────────────────────────────────────────

function ScoreTypeRow({
  scoreType,
  isEditing,
  isSaving,
  isDeleting,
  onEdit,
  onCancel,
  onSave,
  onDelete,
}: {
  scoreType: CategoryScoreType;
  isEditing: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: ScoreTypeFields) => void;
  onDelete: () => void;
}) {
  if (isEditing) {
    return (
      <ScoreTypeInlineForm
        initial={{
          id: scoreType.id,
          name: scoreType.name,
          label: scoreType.label ?? '',
          scoreWeight: scoreType.scoreWeight,
          orderToShow: scoreType.orderToShow,
        }}
        isSaving={isSaving}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/3 px-4 py-3">
      <div className="flex-1">
        <span className="font-mono text-sm text-indigo-300">{scoreType.name}</span>
        {scoreType.label && (
          <span className="ml-2 text-sm text-white/50">{scoreType.label}</span>
        )}
      </div>
      <span className="text-xs text-white/40">weight {scoreType.scoreWeight}</span>
      <span className="text-xs text-white/30">order {scoreType.orderToShow}</span>
      <button onClick={onEdit} className="rounded p-1 hover:bg-white/10">
        <Save className="h-3.5 w-3.5 text-white/40" />
      </button>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="rounded p-1 hover:bg-red-500/20 disabled:opacity-40"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-400/60" />
      </button>
    </div>
  );
}

// ── ScoreTypeInlineForm ───────────────────────────────────────────────────────

function ScoreTypeInlineForm({
  initial,
  isSaving,
  onSave,
  onCancel,
}: {
  initial: ScoreTypeFields;
  isSaving: boolean;
  onSave: (data: ScoreTypeFields) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ScoreTypeFields>({ defaultValues: initial });

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="grid grid-cols-12 gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/5 px-4 py-3"
    >
      <div className="col-span-3">
        <input
          {...register('name', {
            required: true,
            pattern: { value: /^[a-z][a-z0-9_]*$/, message: 'lowercase, digits, underscores' },
          })}
          className={inputCls + ' font-mono text-xs'}
          placeholder="name (e.g. capital)"
        />
        {errors.name && <p className="mt-0.5 text-xs text-red-400">{errors.name.message || 'Required'}</p>}
      </div>
      <div className="col-span-4">
        <input
          {...register('label')}
          className={inputCls + ' text-xs'}
          placeholder="Display label"
        />
      </div>
      <div className="col-span-2">
        <input
          {...register('scoreWeight', { valueAsNumber: true })}
          type="number"
          step="0.1"
          className={inputCls + ' text-xs'}
          placeholder="Weight"
        />
      </div>
      <div className="col-span-1">
        <input
          {...register('orderToShow', { valueAsNumber: true })}
          type="number"
          className={inputCls + ' text-xs'}
          placeholder="Order"
        />
      </div>
      <div className="col-span-2 flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold hover:bg-indigo-500 disabled:opacity-40"
        >
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-xs text-white/50 hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── BadgeTierRow ──────────────────────────────────────────────────────────────

const TIER_COLORS: Record<number, string> = {
  1: 'border-slate-400/30 bg-slate-400/5',
  2: 'border-emerald-400/30 bg-emerald-400/5',
  3: 'border-sky-400/30 bg-sky-400/5',
  4: 'border-violet-400/30 bg-violet-400/5',
  5: 'border-amber-400/30 bg-amber-400/5',
};

const TIER_LABEL_COLORS: Record<number, string> = {
  1: 'text-slate-300',
  2: 'text-emerald-300',
  3: 'text-sky-300',
  4: 'text-violet-300',
  5: 'text-amber-300',
};

function BadgeTierRow({
  tier,
  badge,
  isSaving,
  isDeleting,
  onSave,
  onDelete,
}: {
  tier: number;
  badge: CategoryBadge | undefined;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: (data: BadgeFields) => void;
  onDelete: (badgeId: number) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = useForm<BadgeFields>({
    values: badge
      ? {
          id: badge.id,
          tier,
          label: badge.label,
          labelVi: badge.labelVi ?? '',
          scoreThreshold: badge.scoreThreshold,
          badgeImageUrl: badge.badgeImageUrl ?? '',
        }
      : { tier, label: '', labelVi: '', scoreThreshold: 0, badgeImageUrl: '' },
  });

  return (
    <div className={`rounded-lg border px-4 py-3 ${TIER_COLORS[tier]}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${TIER_LABEL_COLORS[tier]}`}>
          Tier {tier} — {TIER_NAMES[tier]}
        </span>
        {badge && (
          <button
            onClick={() => onDelete(badge.id)}
            disabled={isDeleting}
            className="ml-auto rounded p-1 hover:bg-red-500/20 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400/50" />
          </button>
        )}
      </div>
      <form
        onSubmit={handleSubmit(onSave)}
        className="grid grid-cols-12 gap-2"
      >
        <div className="col-span-3">
          <input
            {...register('label', { required: true })}
            className={inputCls + ' text-xs'}
            placeholder="Label (EN)"
          />
        </div>
        <div className="col-span-3">
          <input
            {...register('labelVi')}
            className={inputCls + ' text-xs'}
            placeholder="Label (VI)"
          />
        </div>
        <div className="col-span-2">
          <input
            {...register('scoreThreshold', { valueAsNumber: true, min: 0 })}
            type="number"
            className={inputCls + ' text-xs'}
            placeholder="Threshold"
          />
        </div>
        <div className="col-span-3">
          <input
            {...register('badgeImageUrl')}
            className={inputCls + ' text-xs'}
            placeholder="Badge image URL"
          />
        </div>
        <div className="col-span-1 flex items-center">
          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="w-full rounded bg-indigo-600 py-2 text-xs font-semibold hover:bg-indigo-500 disabled:opacity-30"
          >
            {isSaving ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
