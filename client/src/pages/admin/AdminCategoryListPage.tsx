import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { categoryApi } from '../../services/categoryApi';

export function AdminCategoryListPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoryApi.admin.getAll,
  });

  const { mutate: deleteCategory } = useMutation({
    mutationFn: (id: number) => categoryApi.admin.delete(id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
  });

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Categories</h1>
          <Link
            to="/admin/categories/new"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" /> New Category
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Weight</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {categories?.map((cat) => (
                  <tr key={cat.id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="px-4 py-3 font-medium">{cat.title}</td>
                    <td className="px-4 py-3 text-white/60">{cat.scoreWeight.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cat.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60">{cat.orderToShow}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/categories/${cat.id}`} className="rounded p-1 hover:bg-white/10">
                          <Pencil className="h-4 w-4 text-white/50" />
                        </Link>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          disabled={deletingId === cat.id}
                          className="rounded p-1 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          {deletingId === cat.id
                            ? <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                            : <Trash2 className="h-4 w-4 text-red-400/60" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
