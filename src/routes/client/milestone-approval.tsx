import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
import { RatingStars } from '@/components/RatingStars';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/milestone-approval')({
  component: MilestoneApprovalPage,
});

function MilestoneApprovalPage() {
  const { allowed, isLoading: guardLoading } = useAuthGuard('client');
  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [milestones, setMilestones] = useState([
    { milestone_id: '1', title: isRTL ? 'التصميم المبدئي' : 'Initial Design', status: 'pending', deliverable_url: 'https://example.com/design-v1.pdf', due_date: '2025-02-01' },
    { milestone_id: '2', title: isRTL ? 'المخططات التنفيذية' : 'Construction Drawings', status: 'pending', deliverable_url: 'https://example.com/drawings.pdf', due_date: '2025-03-15' },
  ]);

  const [ratings, setRatings] = useState<Record<string, { stars: number; comment: string }>>({});
  const [approved, setApproved] = useState<Set<string>>(new Set());

  const handleApprove = (id: string) => {
    setMilestones(prev => prev.map(m => m.milestone_id === id ? { ...m, status: 'completed' } : m));
    setApproved(prev => new Set(prev).add(id));
    toast.success(isRTL ? 'تم اعتماد المرحلة' : 'Milestone approved');
  };

  const handleReject = (id: string) => {
    setMilestones(prev => prev.map(m => m.milestone_id === id ? { ...m, status: 'rejected' } : m));
    toast.error(isRTL ? 'تم رفض المرحلة' : 'Milestone rejected');
  };

  const handleRating = (id: string, stars: number) => {
    setRatings(prev => ({ ...prev, [id]: { ...prev[id], stars, comment: prev[id]?.comment || '' } }));
  };

  const submitRating = (id: string) => {
    toast.success(isRTL ? 'شكراً لتقييمك' : 'Thank you for your rating');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">{isRTL ? 'اعتماد المراحل' : 'Milestone Approval'}</h1>

      <div className="mt-6 space-y-6">
        {milestones.map(m => (
          <Card key={m.milestone_id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{m.title}</CardTitle>
                <StatusBadge status={m.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{isRTL ? 'تاريخ الاستحقاق:' : 'Due:'} {m.due_date}</p>
              {m.deliverable_url && (
                <a href={m.deliverable_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-gold hover:underline">
                  <ExternalLink className="h-4 w-4" />
                  {isRTL ? 'عرض المخرجات' : 'View Deliverable'}
                </a>
              )}

              {m.status === 'pending' && (
                <div className="flex gap-3">
                  <Button onClick={() => handleApprove(m.milestone_id)} className="bg-success text-success-foreground">
                    <CheckCircle2 className="me-1 h-4 w-4" />
                    {isRTL ? 'اعتماد' : 'Approve'}
                  </Button>
                  <Button variant="destructive" onClick={() => handleReject(m.milestone_id)}>
                    <XCircle className="me-1 h-4 w-4" />
                    {isRTL ? 'رفض' : 'Reject'}
                  </Button>
                </div>
              )}

              {approved.has(m.milestone_id) && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <p className="font-semibold text-sm">{isRTL ? 'قيّم هذه المرحلة' : 'Rate this milestone'}</p>
                  <RatingStars rating={ratings[m.milestone_id]?.stars || 0} interactive onChange={(s) => handleRating(m.milestone_id, s)} size={24} />
                  <Textarea
                    placeholder={isRTL ? 'أضف تعليقاً...' : 'Add a comment...'}
                    value={ratings[m.milestone_id]?.comment || ''}
                    onChange={e => setRatings(prev => ({ ...prev, [m.milestone_id]: { ...prev[m.milestone_id], stars: prev[m.milestone_id]?.stars || 0, comment: e.target.value } }))}
                  />
                  <Button size="sm" className="bg-gradient-gold text-gold-foreground" onClick={() => submitRating(m.milestone_id)}>
                    {isRTL ? 'إرسال التقييم' : 'Submit Rating'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
