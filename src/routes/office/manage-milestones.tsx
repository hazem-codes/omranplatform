import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
import { Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/office/manage-milestones')({
  component: ManageMilestonesPage,
});

function ManageMilestonesPage() {
  const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');
  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [milestones, setMilestones] = useState([
    { milestone_id: '1', title: isRTL ? 'التصميم المبدئي' : 'Initial Design', status: 'completed', deliverable_url: '', due_date: '2025-02-01' },
    { milestone_id: '2', title: isRTL ? 'المخططات التنفيذية' : 'Construction Drawings', status: 'in_progress', deliverable_url: '', due_date: '2025-03-15' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const addMilestone = () => {
    if (!newTitle || !newDate) return;
    setMilestones(prev => [...prev, { milestone_id: crypto.randomUUID(), title: newTitle, status: 'pending', deliverable_url: '', due_date: newDate }]);
    setNewTitle(''); setNewDate(''); setNewDesc(''); setShowForm(false);
    toast.success(isRTL ? 'تمت إضافة المرحلة' : 'Milestone added');
  };

  const submitDeliverable = (id: string) => {
    const url = prompt(isRTL ? 'أدخل رابط المخرجات:' : 'Enter deliverable URL:');
    if (!url) return;
    setMilestones(prev => prev.map(m => m.milestone_id === id ? { ...m, deliverable_url: url, status: 'pending' } : m));
    toast.success(isRTL ? 'تم تسليم المخرجات' : 'Deliverable submitted');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">{isRTL ? 'إدارة المراحل' : 'Manage Milestones'}</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-gold text-gold-foreground">
          <Plus className="me-1 h-4 w-4" />{isRTL ? 'إضافة مرحلة' : 'Add Milestone'}
        </Button>
      </div>

      {showForm && (
        <Card className="mt-4">
          <CardContent className="pt-6 space-y-3">
            <div><Label>{isRTL ? 'العنوان' : 'Title'}</Label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="mt-1" /></div>
            <div><Label>{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="mt-1" /></div>
            <div><Label>{isRTL ? 'الوصف' : 'Description'}</Label><Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="mt-1" /></div>
            <Button onClick={addMilestone} className="bg-gradient-gold text-gold-foreground">{isRTL ? 'حفظ' : 'Save'}</Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 space-y-4">
        {milestones.map(m => (
          <Card key={m.milestone_id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-semibold">{m.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={m.status} />
                  <span className="text-xs text-muted-foreground">{m.due_date}</span>
                </div>
              </div>
              {m.status === 'in_progress' && (
                <Button size="sm" variant="outline" onClick={() => submitDeliverable(m.milestone_id)}>
                  <Upload className="me-1 h-4 w-4" />{isRTL ? 'تسليم' : 'Submit'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
