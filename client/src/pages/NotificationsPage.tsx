import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  Bell,
  CheckCheck,
  Inbox,
  Mail,
  MailOpen,
  ShieldAlert,
  Star,
  Trash2,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { notificationApi } from '../services/notificationApi';
import type { Notification } from '../types/notification';

type Folder = 'Inbox' | 'Unread' | 'Archive' | 'Important';

const FOLDERS: { key: Folder; label: string; icon: typeof Inbox }[] = [
  { key: 'Inbox', label: 'Inbox', icon: Inbox },
  { key: 'Unread', label: 'Unread', icon: Mail },
  { key: 'Important', label: 'Important', icon: Star },
  { key: 'Archive', label: 'Archive', icon: Archive },
];

import { timeAgo } from '../utils/dateUtils';

function notificationText(n: Notification): string {
  if (n.message) return n.message;
  if (n.type === 'Reply') return `${n.actorName} replied to your comment`;
  if (n.type === 'Mention') return `${n.actorName} mentioned you in a comment`;
  return `Notification from ${n.actorName}`;
}

function NotificationTypeIcon({ type }: { type: Notification['type'] }) {
  if (type === 'Ban' || type === 'Restrict')
    return <ShieldAlert className="h-4 w-4 text-red-500" />;
  if (type === 'System') return <Bell className="h-4 w-4 text-blue-500" />;
  if (type === 'Mention')
    return (
      <span className="flex h-4 w-4 items-center justify-center text-xs font-bold text-violet-600">
        @
      </span>
    );
  return <MailOpen className="h-4 w-4 text-muted-foreground" />;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState<Folder>('Inbox');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-folder', folder, page],
    queryFn: () => notificationApi.getByFolder(folder, page, PAGE_SIZE),
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications-folder'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    setSelected(new Set());
  };

  const { mutate: markRead } = useMutation({
    mutationFn: (ids: number[]) => notificationApi.markRead(ids),
    onSuccess: invalidate,
  });

  const { mutate: archiveNotifications } = useMutation({
    mutationFn: (ids: number[]) => notificationApi.archive(ids),
    onSuccess: invalidate,
  });

  const { mutate: toggleImportant } = useMutation({
    mutationFn: (id: number) => notificationApi.toggleImportant(id),
    onSuccess: invalidate,
  });

  const { mutate: cleanupArchived } = useMutation({
    mutationFn: () => notificationApi.cleanupArchived(),
    onSuccess: invalidate,
  });

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((n) => n.id)));
  }

  function handleClick(n: Notification) {
    if (n.storyId && n.commentId) {
      navigate(`/stories/${n.storyId}#comment-${n.commentId}`);
    }
  }

  const selectedIds = Array.from(selected);
  const hasUnread = selectedIds.some((id) => items.find((n) => n.id === id && !n.isRead));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <div className="relative overflow-hidden border-b" style={{ background: 'linear-gradient(160deg,#0a0e1a,#0f1626)' }}>
        <div className="pointer-events-none absolute -top-16 right-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Bell className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Notifications</h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Sidebar - folders */}
          <nav className="flex shrink-0 flex-row gap-1 sm:w-48 sm:flex-col">
            {FOLDERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFolder(f.key); setPage(1); setSelected(new Set()); }}
                className={[
                  'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  folder === f.key
                    ? 'text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')}
                style={folder === f.key ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : undefined}
              >
                <f.icon className="h-4 w-4" />
                {f.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                onClick={selectAll}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                {selected.size === items.length && items.length > 0 ? 'Deselect All' : 'Select All'}
              </button>

              {selectedIds.length > 0 && (
                <>
                  {hasUnread && (
                    <button
                      onClick={() => markRead(selectedIds)}
                      className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                    >
                      <CheckCheck className="h-3 w-3" /> Mark Read
                    </button>
                  )}
                  {folder !== 'Archive' && (
                    <button
                      onClick={() => archiveNotifications(selectedIds)}
                      className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                    >
                      <Archive className="h-3 w-3" /> Archive
                    </button>
                  )}
                </>
              )}

              {folder === 'Archive' && (
                <button
                  onClick={() => cleanupArchived()}
                  className="ml-auto flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Clean Up Old
                </button>
              )}
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-muted-foreground">
                <Bell className="mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">No notifications in {folder}</p>
              </div>
            ) : (
              <div className="divide-y divide-border rounded-2xl border border-border">
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={[
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      !n.isRead ? 'bg-violet-500/5' : '',
                      selected.has(n.id) ? 'bg-accent/50' : '',
                    ].join(' ')}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selected.has(n.id)}
                      onChange={() => toggleSelect(n.id)}
                      className="mt-1 h-4 w-4 rounded border-border accent-violet-600"
                    />

                    {/* Icon */}
                    <div className="mt-0.5 flex-shrink-0">
                      <NotificationTypeIcon type={n.type} />
                    </div>

                    {/* Content */}
                    <button
                      onClick={() => handleClick(n)}
                      disabled={!n.storyId}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm text-foreground">
                        {notificationText(n)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {n.actorName} &middot; {timeAgo(n.createdAt)}
                      </p>
                    </button>

                    {/* Important toggle */}
                    <button
                      onClick={() => toggleImportant(n.id)}
                      title={n.isImportant ? 'Remove from Important' : 'Mark as Important'}
                      className="mt-0.5 flex-shrink-0"
                    >
                      <Star
                        className={[
                          'h-4 w-4 transition-colors',
                          n.isImportant
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground/40 hover:text-yellow-400',
                        ].join(' ')}
                      />
                    </button>

                    {/* Unread dot */}
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-violet-500" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Prev
                </button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
