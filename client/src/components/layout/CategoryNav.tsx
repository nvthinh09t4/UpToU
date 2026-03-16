import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../../services/categoryApi';

export function CategoryNav() {
  const { id } = useParams<{ id: string }>();
  const activeId = id ? parseInt(id, 10) : null;
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getAll,
    staleTime: 5 * 60_000,
  });

  if (isLoading || categories.length === 0) return null;

  return (
    <nav className="sticky top-[57px] z-40 border-b bg-background/90 backdrop-blur-md">
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <Link
          to="/"
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
            activeId === null
              ? 'text-white shadow-sm'
              : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          style={activeId === null ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : undefined}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/categories/${cat.id}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
              activeId === cat.id
                ? 'text-white shadow-sm'
                : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            style={activeId === cat.id ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : undefined}
          >
            {cat.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
