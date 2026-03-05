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
    <nav className="border-b bg-background sticky top-[65px] z-40">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-3 sm:px-6 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <Link
          to="/"
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap
            ${activeId === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/categories/${cat.id}`}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap
              ${activeId === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
          >
            {cat.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}
