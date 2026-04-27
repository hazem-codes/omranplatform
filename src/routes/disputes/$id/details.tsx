import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { supervisorService } from '@/services/supervisorService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/disputes/$id/details')({
  component: DisputeDetailsPage,
});

const dash = (v: any) => (v === null || v === undefined || v === '' ? '—' : v);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="mb-4 text-lg font-bold text-primary">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium break-words whitespace-pre-line">{value}</p>
    </div>
  );
}

function DisputeDetailsPage() {
  const { id } = useParams({ from: '/disputes/$id/details' });
  const { role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!authLoading && role !== 'supervisor') navigate({ to: '/forbidden' as '/' });
  }, [role, authLoading, navigate]);

  useEffect(() => {
    if (role !== 'supervisor') return;
    (async () => {
      try {
        setLoading(true);
        const { data: report } = await supabase.from('reports').select('*').eq('report_id', id).maybeSingle();
        let project: any = null;
        let clientProfile: any = null;
        let officeProfile: any = null;
        if (report?.project_id) {
          const { data: p } = await supabase.from('projects').select('*').eq('project_id', report.project_id).maybeSingle();
          project = p;
        }
        if (report?.client_id) {
          const { data: cp } = await supabase.from('profiles').select('id,name,email').eq('id', report.client_id).maybeSingle();
          clientProfile = cp;
        }
        setDispute({ ...(report || {}), project, clientProfile, officeProfile });
      } catch (e: any) {
        toast.error(e?.message || 'فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, role]);

  const handleResolve = async () => {
    try {
      await supervisorService.resolveReport(id, 'resolved');
      toast.success('تم حل النزاع');
      setResolveOpen(false);
      navigate({ to: '/supervisor/disputes' as '/' });
    } catch (e: any) { toast.error(e?.message || 'فشل'); }
  };

  const handleReject = async () => {
    try {
      await supervisorService.resolveReport(id, 'rejected');
      toast.success('تم الرفض');
      setRejectOpen(false);
      navigate({ to: '/supervisor/disputes' as '/' });
    } catch (e: any) { toast.error(e?.message || 'فشل'); }
  };

  if (authLoading || role !== 'supervisor') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 pt-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">تفاصيل النزاع</h1>
        <Button variant="outline" onClick={() => navigate({ to: '/supervisor/disputes' as '/' })}>
          <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" /> العودة
        </Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">جاري التحميل...</div>
      ) : !dispute ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">لا توجد بيانات</div>
      ) : (
        <>
          <Section title="معلومات النزاع">
            <Field label="رقم النزاع" value={dash(dispute.report_id)} />
            <Field label="تاريخ الرفع" value={dash(dispute.created_at ? new Date(dispute.created_at).toLocaleString('ar') : null)} />
            <Field label="الحالة" value={dash(dispute.status)} />
          </Section>

          <Section title="أطراف النزاع">
            <Field label="اسم العميل" value={dash(dispute.clientProfile?.name)} />
            <Field label="البريد الإلكتروني للعميل" value={dash(dispute.clientProfile?.email)} />
          </Section>

          <Section title="تفاصيل النزاع">
            <Field label="عنوان المشروع المرتبط" value={dash(dispute.project?.title)} />
            <div className="sm:col-span-2">
              <Field label="وصف النزاع" value={dash(dispute.description)} />
            </div>
          </Section>

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold text-primary">إجراءات المشرف</h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setResolveOpen(true)} className="bg-success text-success-foreground hover:bg-success/90">
                <CheckCircle2 className="me-1 h-4 w-4" /> حل النزاع
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="me-1 h-4 w-4" /> رفض
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/supervisor/disputes' as '/' })}>العودة</Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>ملاحظات الحل</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الملاحظات</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
            </div>
            <Button className="w-full bg-success text-success-foreground" onClick={handleResolve}>
              <CheckCircle2 className="h-4 w-4 me-2" /> تأكيد الحل
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>سبب الرفض</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>السبب</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
            </div>
            <Button variant="destructive" className="w-full" onClick={handleReject}>
              <XCircle className="h-4 w-4 me-2" /> تأكيد الرفض
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
