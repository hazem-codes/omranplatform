import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning-foreground border-warning/30',
  approved: 'bg-success/20 text-success border-success/30',
  rejected: 'bg-destructive/20 text-destructive border-destructive/30',
  active: 'bg-primary/20 text-primary border-primary/30',
  completed: 'bg-success/20 text-success border-success/30',
  submitted: 'bg-accent/20 text-accent-foreground border-accent/30',
  held: 'bg-muted text-muted-foreground border-border',
  released: 'bg-success/20 text-success border-success/30',
  frozen: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
  open: 'bg-warning/20 text-warning-foreground border-warning/30',
  resolved: 'bg-success/20 text-success border-success/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
  withdrawn: 'bg-muted text-muted-foreground border-border',
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const colorClass = statusColors[status] || 'bg-muted text-muted-foreground';

  return (
    <Badge variant="outline" className={colorClass}>
      {t(`status.${status}`, status)}
    </Badge>
  );
}
