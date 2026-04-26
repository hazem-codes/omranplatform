import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/submit-report')({
  component: SubmitReportPage,
});

function SubmitReportPage() {
  const { allowed, isLoading: guardLoading } = useAuthGuard('client');
  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');

  const projects = [
    { id: 'p1', title: isRTL ? 'تصميم فيلا سكنية' : 'Residential Villa Design' },
    { id: 'p2', title: isRTL ? 'مجمع تجاري' : 'Commercial Complex' },
  ];

  const handleSubmit = () => {
    if (!projectId || !description) return;
    toast.success(isRTL ? 'تم تقديم البلاغ بنجاح' : 'Report submitted successfully');
    setProjectId('');
    setDescription('');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-black">{isRTL ? 'تقديم بلاغ' : 'Submit Report'}</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {isRTL ? 'نموذج البلاغ' : 'Report Form'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{isRTL ? 'اختر المشروع' : 'Select Project'}</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={isRTL ? 'اختر...' : 'Choose...'} /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{isRTL ? 'وصف المشكلة' : 'Describe the Issue'}</Label>
            <Textarea className="mt-1" rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder={isRTL ? 'اشرح المشكلة بالتفصيل...' : 'Describe the issue in detail...'} />
          </div>
          <Button className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" onClick={handleSubmit}>
            {isRTL ? 'إرسال البلاغ' : 'Submit Report'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
