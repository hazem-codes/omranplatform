import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/StatusBadge';
import { CheckCircle2, Clock, Circle } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/project-tracking')({
  component: ProjectTrackingPage,
});

function ProjectTrackingPage() {
  const { allowed, isLoading: guardLoading } = useAuthGuard('client');
  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [project] = useState({
    project_id: 'demo-1',
    title: isRTL ? 'تصميم فيلا سكنية' : 'Residential Villa Design',
    status: 'active',
    progress_percentage: 60,
    start_date: '2025-01-15',
    description: isRTL ? 'تصميم معماري وإنشائي لفيلا سكنية' : 'Architectural and structural design for a residential villa',
  });

  const [milestones] = useState([
    { milestone_id: '1', title: isRTL ? 'التصميم المبدئي' : 'Initial Design', status: 'completed', due_date: '2025-02-01' },
    { milestone_id: '2', title: isRTL ? 'التصميم التفصيلي' : 'Detailed Design', status: 'completed', due_date: '2025-03-01' },
    { milestone_id: '3', title: isRTL ? 'المخططات التنفيذية' : 'Construction Drawings', status: 'in_progress', due_date: '2025-04-15' },
    { milestone_id: '4', title: isRTL ? 'المراجعة النهائية' : 'Final Review', status: 'pending', due_date: '2025-05-01' },
  ]);

  const statusIcon = (s: string) => {
    if (s === 'completed') return <CheckCircle2 className="h-5 w-5 text-success" />;
    if (s === 'in_progress') return <Clock className="h-5 w-5 text-warning" />;
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">{isRTL ? 'تتبع المشروع' : 'Project Tracking'}</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{project.description}</p>
          <div className="flex items-center gap-4">
            <StatusBadge status={project.status} />
            <span className="text-sm text-muted-foreground">
              {isRTL ? 'تاريخ البدء:' : 'Start Date:'} {project.start_date}
            </span>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>{isRTL ? 'التقدم' : 'Progress'}</span>
              <span>{project.progress_percentage}%</span>
            </div>
            <Progress value={project.progress_percentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <h2 className="mt-10 text-xl font-bold">{t('milestones.title')}</h2>
      <div className="mt-4 space-y-0">
        {milestones.map((m, idx) => (
          <div key={m.milestone_id} className="flex gap-4">
            <div className="flex flex-col items-center">
              {statusIcon(m.status)}
              {idx < milestones.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
            </div>
            <div className="pb-8">
              <p className="font-semibold">{m.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={m.status} />
                <span className="text-xs text-muted-foreground">{m.due_date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
