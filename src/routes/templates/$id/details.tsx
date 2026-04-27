import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { supervisorService } from '@/services/supervisorService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowRight, FileText, XCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { unpackMeta } from '@/lib/officeMeta';
import { SERVICE_CATEGORIES_DATA, type ServiceCategory } from '@/types';

export const Route = createFileRoute('/templates/$id/details')({
  component: TemplateDetailsPage,
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

function TemplateDetailsPage() {
  const { id } = useParams({ from: '/templates/$id/details' });
  const { role, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tpl, setTpl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!authLoading && role !== 'supervisor') navigate({ to: '/forbidden' as '/' });
  }, [role, authLoading, navigate]);

  useEffect(() => {
    if (role !== 'supervisor') return;
    (async () => {
      try {
        setLoading(true);
        const { data: t } = await supabase.from('templates').select('*').eq('template_id', id).maybeSingle();
        if (!t) { setTpl(null); return; }
        const { description, meta } = unpackMeta((t as any).description);
        let office: any = null;
        let officeProfile: any = null;
        if (t.office_id) {
          const { data: o } = await supabase.from('engineering_offices').select('*').eq('id', t.office_id).maybeSingle();
          office = o;
          const { data: p } = await supabase.from('profiles').select('id,name,email').eq('id', t.office_id).maybeSingle();
          officeProfile = p;
        }
        setTpl({
          ...t,
          description,
          category: (t as any).category ?? meta.category ?? null,
          sub_category: (t as any).sub_category ?? meta.sub_category ?? null,
          file_url: (t as any).file_url ?? meta.file_url ?? null,
          office,
          officeProfile,
        });
      } catch (e: any) {
        toast.error(e?.message || 'فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, role]);

  const handleApprove = async () => {
    try {
      await supervisorService.approveTemplate(id);
      toast.success('تم الاعتماد');
      navigate({ to: '/supervisor/dashboard' as '/' });
    } catch (e: any) { toast.error(e?.message || 'فشل'); }
  };
  const handleReject = async () => {
    try {
      await supervisorService.rejectTemplate(id, reason);
      toast.success('تم الرفض');
      setRejectOpen(false);
      navigate({ to: '/supervisor/dashboard' as '/' });
    } catch (e: any) { toast.error(e?.message || 'فشل'); }
  };

  if (authLoading || role !== 'supervisor') return null;

  const cat = tpl?.category ? SERVICE_CATEGORIES_DATA[tpl.category as ServiceCategory] : null;
  const sub = cat?.subcategories.find((s) => s.key === tpl?.sub_category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-background dark:to-muted/30 pt-20"><div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">تفاصيل القالب</h1>
        <Button variant="outline" onClick={() => navigate({ to: '/supervisor/dashboard' as '/' })}>
          <ArrowRight className="ms-1 h-4 w-4 rtl:rotate-180" /> العودة
        </Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">جاري التحميل...</div>
      ) : !tpl ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">لا توجد بيانات</div>
      ) : (
        <>
          <Section title="معلومات القالب">
            <Field label="عنوان القالب" value={dash(tpl.title)} />
            <Field label="السعر" value={tpl.price ? `${Number(tpl.price).toLocaleString()} ر.س` : '—'} />
            <Field label="الفئة الرئيسية" value={dash(cat?.ar)} />
            <Field label="الفئة الفرعية" value={dash(sub?.ar)} />
            <div className="sm:col-span-2">
              <Field label="الوصف" value={dash(tpl.description)} />
            </div>
          </Section>

          <Section title="معلومات المكتب">
            <Field label="اسم المكتب" value={dash(tpl.officeProfile?.name)} />
            <Field label="رقم الترخيص" value={dash(tpl.office?.license_number)} />
            <Field label="البريد الإلكتروني" value={dash(tpl.officeProfile?.email)} />
          </Section>

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold text-primary">ملف القالب</h2>
            {tpl.file_url ? (
              <a href={tpl.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border bg-accent px-3 py-1.5 text-sm font-medium text-primary hover:bg-accent/70">
                <FileText className="h-4 w-4" /> عرض / تحميل الملف
              </a>
            ) : (
              <p className="text-sm font-medium">—</p>
            )}
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold text-primary">إجراءات المشرف</h2>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleApprove} className="bg-success text-success-foreground hover:bg-success/90">
                <CheckCircle2 className="me-1 h-4 w-4" /> اعتماد
              </Button>
              <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                <XCircle className="me-1 h-4 w-4" /> رفض
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/supervisor/dashboard' as '/' })}>العودة</Button>
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
              <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} />
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
