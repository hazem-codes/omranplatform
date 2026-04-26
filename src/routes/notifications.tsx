import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NotificationData } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { allowed, isLoading: guardLoading } = useAuthGuard();
  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    if (user?.id) {
      notificationService.getByUser(user.id).then(data => setNotifications(data as unknown as NotificationData[])).catch(() => {});
    }
  }, [user?.id]);

  const markRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-black flex items-center gap-2">
        <Bell className="h-6 w-6 text-gold" />
        {t('nav.notifications')}
      </h1>
      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">{t('common.no_data')}</p>
        ) : (
          notifications.map(n => (
            <div key={n.notification_id} className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${n.is_read ? 'bg-card' : 'bg-gold/5 border-gold/20'}`}>
              <div className="flex-1">
                <p className="text-sm">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}
                </p>
              </div>
              {!n.is_read && (
                <Button variant="ghost" size="icon" onClick={() => markRead(n.notification_id)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
