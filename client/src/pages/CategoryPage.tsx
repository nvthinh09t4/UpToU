import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Tag, BarChart3 } from 'lucide-react';
import { categoryApi } from '../services/categoryApi';
import { CategoryNav } from '../components/layout/CategoryNav';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const categoryId = parseInt(id ?? '0', 10);

  const { data: category, isLoading, error } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoryApi.getById(categoryId),
    enabled: !!categoryId,
  });

  const nav = (
    <>
      {/* Reuse the same sticky nav that shows all categories */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="text-xl font-bold tracking-tight">UpToU</Link>
          <Link to="/login">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      </header>
      <CategoryNav />
    </>
  );

  if (isLoading) {
    return (
      <>
        {nav}
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  if (error || !category) {
    return (
      <>
        {nav}
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <p className="text-muted-foreground">Category not found.</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="outline" className="gap-2 mt-4">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {nav}

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{category.title}</span>
        </div>

        {/* Hero */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Tag className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{category.title}</h1>
          </div>
          {category.description && (
            <p className="max-w-2xl text-muted-foreground text-lg">{category.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Score weight: <strong className="text-foreground">{category.scoreWeight.toFixed(1)}</strong>
            </span>
          </div>
        </div>

        {/* Sub-categories */}
        {category.children.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-bold">Sub-categories</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.children.map((child) => (
                <Card key={child.id} className="border hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-1">{child.title}</h3>
                    {child.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{child.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Placeholder content */}
        <section>
          <h2 className="mb-4 text-xl font-bold">Latest in {category.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="mb-3 h-2 w-16 rounded bg-primary/20" />
                  <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
                  <div className="mb-1 h-3 w-full rounded bg-muted/70" />
                  <div className="h-3 w-5/6 rounded bg-muted/70" />
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted/70" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Content for <strong>{category.title}</strong> will appear here once published.
          </p>
        </section>
      </main>

      <footer className="border-t bg-muted/20 mt-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:text-left">
          <span className="font-semibold text-foreground">UpToU</span>
          <span>© {new Date().getFullYear()} UpToU, Inc.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}
