import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { RoleInbox } from '@/components/shared/RoleInbox';

export const Route = createFileRoute('/client/inbox')({
  component: ClientInboxPage,
});

function ClientInboxPage() {
  const { allowed, isLoading } = useAuthGuard('client');
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';

  if (!allowed) {
    return isLoading ? (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-muted-foreground">
          {isRTL ? 'جاري التحقق...' : 'Checking...'}
        </span>
      </div>
    ) : null;
  }

  if (!user?.id) return null;

  return <RoleInbox role="client" userId={user.id} isRTL={isRTL} />;
}
