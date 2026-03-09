import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, AtSign } from 'lucide-react';
import { notificationApi } from '../../services/notificationApi';
import type { Notification } from '../../types/notification';

interface NotificationPanelProps {
  onClose: () => void;
}

function NotificationIcon({ type }: { type: Notification['type'] }) {
  if (type === 'Mention') return <AtSign className="h-4 w-4 text-primary" />;
  return <MessageSquare className="h-4 w-4 text-blue-500" />;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll(),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (ids: number[]) => notificationApi.markRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Mark all unread as read when panel opens
  useEffect(() => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length > 0) markRead(unreadIds);
  }, [notifications, markRead]);

  function handleClick(n: Notification) {
    onClose();
    navigate(`/stories/${n.storyId}#comment-${n.commentId}`);
  }

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-popover shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Bell className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={[
                'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent',
                !n.isRead ? 'bg-primary/5' : '',
              ].join(' ')}
            >
              <div className="mt-0.5 flex-shrink-0">
                <NotificationIcon type={n.type} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground">
                  <span className="font-semibold">{n.actorName}</span>
                  {n.type === 'Reply' ? ' replied to your comment' : ' mentioned you in a comment'}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
