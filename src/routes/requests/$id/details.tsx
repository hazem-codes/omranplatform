import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supervisorService } from '@/services/supervisorService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/requests/$id/details')({
  component: RequestDetailsPage,
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

function Field({ label, value, full = false }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

function RequestDetailsPage() {
  const { id } = useParams({ from: '/requests/$id/details' });
  const { role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!authLoading && role !== 'supervisor') {
      navigate({ to: '/forbidden' as '/' });
    }
  }, [role, authLoading, navigate]);

  useEffect(() => {
    if (role !== 'supervisor') return;
    (async () => {
      try {
        setLoading(true);
        const data = await supervisorService.getProjectRequestById(id);
        setReq(data);
      } catch (e: any) {
        toast.error(e?.message || 'فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, role]);

  const handleApprove = async () => {
    try {
      await supervisorService.approveProjectRequest(id);
      toast.success('تمت الموافقة على الطلب');
      navigate({ to: '/supervisor/dashboard' as '/' });
    } catch (e: any) { toast.error(e?.message || 'فشل'); }
  };

  const handleReject = async () => {
    try {
      await supervisorService.rejectProjectRequest(id, rejectReason);
      toast.success('تم الرفض');
      setRejectOpen(false);
      navigate({ to: '/supervisor/dashboard' as '/' });
    } catch (e: any) { toast.error(e?.message || 'فشل'); }
  };

  if (authLoading || role !== 'supervisor') return null;

  // Parse budget range (stored as "min-max" string)
  let budgetFrom: any = req?.budget_min ?? null;
  let budgetTo: any = req?.budget_max ?? null;
  if ((budgetFrom == null || budgetTo == null) && typeof req?.budget_range === 'string') {
    const m = req.budget_range.split(/\s*[-–]\s*/);
    if (m.length === 2) {
      budgetFrom = budgetFrom ?? m[0];
      budgetTo = budgetTo ?? m[1];
    } else {
      budgetFrom = budgetFrom ?? req.budget_range;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-background dark:to-muted/30 pt-20"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">تفاصيل طلب المشروع</h1>
        <Button variant="outline" onClick={() => navigate({ to: '/supervisor/dashboard' as '/' })}>
          <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" /> العودة
        </Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">جاري التحميل...</div>
      ) : !req ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">لا توجد بيانات</div>
      ) : (
        <>
          <Section title="معلومات المشروع">
            <Field label="عنوان المشروع" value={dash(req.title)} />
            <Field label="فئة الخدمة" value={dash(req.service_category ?? req.category)} />
            <Field label="التخصص الفرعي" value={dash(req.sub_category)} />
            <Field label="الموقع" value={dash(req.location)} />
            <Field label="المساحة (م²)" value={dash(req.area_sqm ?? req.area)} />
          </Section>

          <Section title="التفاصيل المالية والزمنية">
            <Field label="الميزانية (من)" value={dash(budgetFrom)} />
            <Field label="الميزانية (إلى)" value={dash(budgetTo)} />
            <Field label="المدة (أسابيع)" value={dash(req.duration_weeks ?? req.timeline_weeks)} />
          </Section>

          <Section title="وصف المشروع">
            <Field label="وصف المشروع" value={dash(req.description)} full />
          </Section>

          <Section title="معلومات العميل">
            <Field label="الاسم الكامل" value={dash(req.client_profile?.name)} />
            <Field label="البريد الإلكتروني" value={dash(req.client_profile?.email)} />
            <Field label="رقم الهاتف" value={dash(req.client_phone)} />
          </Section>

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold text-primary">إجراءات المشرف</h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleApprove} className="bg-success text-success-foreground hover:bg-success/90">
                <CheckCircle2 className="me-1 h-4 w-4" /> اعتماد
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="me-1 h-4 w-4" /> رفض
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/supervisor/dashboard' as '/' })}>
                العودة
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>سبب الرفض</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>السبب</Label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
            </div>
            <Button variant="destructive" className="w-full" onClick={handleReject}>
              <XCircle className="h-4 w-4 me-2" /> تأكيد الرفض
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
