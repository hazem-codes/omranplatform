import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supervisorService } from '@/services/supervisorService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowRight, FileText, XCircle, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/registrations/$id/details')({
  component: RegistrationDetailsPage,
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
      <p className="mt-1 text-sm font-medium break-words">{value}</p>
    </div>
  );
}

function RegistrationDetailsPage() {
  const { id } = useParams({ from: '/registrations/$id/details' });
  const { role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [office, setOffice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Access control: supervisor only
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
        const data = await supervisorService.getOfficeRegistrationById(id);
        setOffice(data);
      } catch (e: any) {
        toast.error(e?.message || 'فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, role]);

  const handleApprove = async () => {
    try {
      await supervisorService.approveOfficeRegistration(id);
      toast.success('تمت الموافقة على المكتب');
      navigate({ to: '/supervisor/dashboard' as '/' });
    } catch (e: any) { toast.error(e?.message || 'فشل'); }
  };

  const handleReject = async () => {
    try {
      await supervisorService.rejectOfficeRegistration(id, rejectReason);
      toast.success('تم الرفض');
      setRejectOpen(false);
      navigate({ to: '/supervisor/dashboard' as '/' });
    } catch (e: any) { toast.error(e?.message || 'فشل'); }
  };

  if (authLoading || role !== 'supervisor') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 pt-20"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">تفاصيل تسجيل المكتب</h1>
        <Button variant="outline" onClick={() => navigate({ to: '/supervisor/dashboard' as '/' })}>
          <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" />
          العودة
        </Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">جاري التحميل...</div>
      ) : !office ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">لا توجد بيانات</div>
      ) : (
        <>
          <Section title="معلومات الحساب">
            <Field label="نوع الحساب" value="مكتب هندسي" />
            <Field label="الاسم الكامل (اسم المكتب)" value={dash(office.profile?.name)} />
            <Field label="البريد الإلكتروني" value={dash(office.profile?.email)} />
            <Field label="رقم الهاتف" value={dash(office.phone)} />
          </Section>

          <Section title="بيانات الترخيص">
            <Field label="رقم الترخيص (هيئة المهندسين السعوديين)" value={dash(office.license_number)} />
            <Field label="تاريخ انتهاء الترخيص" value={dash(office.license_expiry_date)} />
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">صورة الرخصة (PDF أو صورة)</p>
              {office.license_document_url ? (
                <a
                  href={office.license_document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-2 rounded-md border bg-accent px-3 py-1.5 text-sm font-medium text-primary hover:bg-accent/70"
                >
                  <FileText className="h-4 w-4" />
                  عرض / تحميل الملف
                </a>
              ) : (
                <p className="mt-1 text-sm font-medium">—</p>
              )}
            </div>
          </Section>

          <Section title="بيانات المكتب">
            <Field label="المدينة" value={dash(office.city)} />
            <Field label="نوع المكتب" value={dash(office.office_type)} />
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">مناطق التغطية</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {(() => {
                  const arr = Array.isArray(office.coverage_areas) ? office.coverage_areas : null;
                  const raw = office.coverage_area;
                  const list = arr && arr.length
                    ? arr
                    : Array.isArray(raw)
                      ? raw
                      : typeof raw === 'string' && raw.length
                        ? raw.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean)
                        : [];
                  if (list.length === 0) return <span className="text-sm font-medium">—</span>;
                  return list.map((c: string, i: number) => (
                    <span key={i} className="rounded-full border bg-accent px-3 py-1 text-xs font-medium text-primary">{c}</span>
                  ));
                })()}
              </div>
            </div>
            <Field label="سنوات الخبرة" value={dash(office.years_of_experience)} />
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
    </div></div>
  );
}
