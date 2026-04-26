import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { supervisorService } from '@/services/supervisorService';
import { bidService } from '@/services/bidService';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import {
  ArrowLeft, ArrowRight, MapPin, DollarSign, Calendar, Ruler, Clock,
  User, Mail, Phone, FileText, Send, CheckCircle2, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { decodeLocation } from '@/lib/locationCodec';

const StaticLocationMap = lazy(() => import('@/components/map/StaticLocationMap'));

export const Route = createFileRoute('/office/requests/$id')({
  component: OfficeRequestDetailsPage,
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

function Field({
  label, value, icon: Icon, full = false,
}: { label: string; value: React.ReactNode; icon?: any; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

function OfficeRequestDetailsPage() {
  const { id } = useParams({ from: '/office/requests/$id' });
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');
  const sar = isRTL ? 'ر.س' : 'SAR';

  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [existingBid, setExistingBid] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!allowed || !user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [data, bids] = await Promise.all([
          supervisorService.getProjectRequestById(id),
          bidService.getByOffice(user.id),
        ]);
        if (cancelled) return;
        if (data) {
          const loc = decodeLocation(data.location);
          setReq({
            ...data,
            _city: loc.city || '-',
            _coords: loc.latitude != null && loc.longitude != null
              ? { lat: loc.latitude, lng: loc.longitude } : null,
            _formattedAddress: loc.formattedAddress || '',
          });
        }
        const mine = (Array.isArray(bids) ? bids : []).find(
          (b: any) => b?.request_id === id && b.status !== 'withdrawn'
        );
        setExistingBid(mine || null);
      } catch (e: any) {
        toast.error(e?.message || (isRTL ? 'فشل تحميل البيانات' : 'Failed to load'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, allowed, user?.id]);

  if (!allowed) {
    return guardLoading
      ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div>
      : null;
  }

  const isDirect = !!req?.target_office_id;

  const handleAcceptDirect = async () => {
    if (!req || !user?.id) return;
    try {
      setProcessing(true);
      await bidService.submitBid({
        request_id: req.request_id,
        office_id: user.id,
        price: parseFloat((req.budget_range || '').replace(/[^\d.]/g, '') || '0'),
        timeline: 30,
      });
      toast.success(isRTL ? 'تم قبول الطلب' : 'Request accepted');
      setExistingBid({ status: 'submitted' });
    } catch (e: any) { toast.error(e.message); }
    finally { setProcessing(false); }
  };

  // Budget parsing
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

  const files: any[] = Array.isArray(req?.attachments)
    ? req.attachments
    : Array.isArray(req?.files) ? req.files : [];

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">{isRTL ? 'تفاصيل طلب المشروع' : 'Project Request Details'}</h1>
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/office/browse-requests' })}>
          <Arrow className="h-4 w-4 me-1" />
          {isRTL ? 'العودة' : 'Back'}
        </Button>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin inline me-2" />
          {isRTL ? 'جاري التحميل...' : 'Loading...'}
        </div>
      ) : !req ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          {isRTL ? 'لا توجد بيانات' : 'No data'}
        </div>
      ) : (
        <>
          {isDirect && (
            <div className="rounded-xl bg-gold/10 px-4 py-2 text-sm font-medium text-gold inline-block">
              {isRTL ? 'حجز مباشر لمكتبك' : 'Direct booking for your office'}
            </div>
          )}

          <Section title={isRTL ? 'معلومات المشروع' : 'Project Information'}>
            <Field label={isRTL ? 'عنوان المشروع' : 'Project Title'} value={dash(req.title)} full />
            <Field label={isRTL ? 'فئة الخدمة' : 'Service Category'} value={dash(req.service_category ?? req.category)} />
            <Field label={isRTL ? 'التخصص الفرعي' : 'Sub-category'} value={dash(req.sub_category)} />
            <Field label={isRTL ? 'الموقع' : 'Location'} value={dash(req._city)} icon={MapPin} />
            <Field label={isRTL ? 'المساحة (م²)' : 'Area (m²)'} value={dash(req.area_sqm ?? req.area)} icon={Ruler} />
          </Section>

          <Section title={isRTL ? 'التفاصيل المالية والزمنية' : 'Budget & Timeline'}>
            <Field label={`${isRTL ? 'الميزانية (من)' : 'Budget (from)'} (${sar})`} value={dash(budgetFrom)} icon={DollarSign} />
            <Field label={`${isRTL ? 'الميزانية (إلى)' : 'Budget (to)'} (${sar})`} value={dash(budgetTo)} icon={DollarSign} />
            <Field label={isRTL ? 'المدة (أسابيع)' : 'Duration (weeks)'} value={dash(req.duration_weeks ?? req.timeline_weeks)} icon={Clock} />
            <Field label={isRTL ? 'تاريخ النشر' : 'Posted on'} value={req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'} icon={Calendar} />
          </Section>

          <Section title={isRTL ? 'وصف المشروع' : 'Project Description'}>
            <Field label={isRTL ? 'الوصف' : 'Description'} value={dash(req.description)} full />
          </Section>

          {req._coords && (
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="mb-4 text-lg font-bold text-primary">{isRTL ? 'موقع المشروع' : 'Project Location'}</h2>
              <Suspense fallback={<div className="h-56 rounded-lg border bg-muted animate-pulse" />}>
                <StaticLocationMap latitude={req._coords.lat} longitude={req._coords.lng} height="14rem" />
              </Suspense>
              {req._formattedAddress && (
                <p className="mt-3 text-xs text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-gold" />
                  <span>{req._formattedAddress}</span>
                </p>
              )}
            </div>
          )}

          <Section title={isRTL ? 'معلومات العميل' : 'Client Information'}>
            <Field label={isRTL ? 'الاسم الكامل' : 'Full Name'} value={dash(req.client_profile?.name)} icon={User} />
            <Field label={isRTL ? 'البريد الإلكتروني' : 'Email'} value={dash(req.client_profile?.email)} icon={Mail} />
            <Field label={isRTL ? 'رقم الهاتف' : 'Phone'} value={dash(req.client_phone)} icon={Phone} />
          </Section>

          {files.length > 0 && (
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="mb-4 text-lg font-bold text-primary">{isRTL ? 'الملفات المرفقة' : 'Uploaded Files'}</h2>
              <ul className="space-y-2">
                {files.map((f: any, i: number) => {
                  const url = typeof f === 'string' ? f : (f?.url || f?.path || '');
                  const name = typeof f === 'string' ? f.split('/').pop() : (f?.name || f?.filename || url.split('/').pop());
                  return (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <FileText className="h-4 w-4" />
                        {name || `File ${i + 1}`}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold text-primary">{isRTL ? 'الإجراءات' : 'Actions'}</h2>
            {existingBid ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{isRTL ? 'حالة عرضك:' : 'Your bid status:'}</span>
                <StatusBadge status={existingBid.status || 'submitted'} />
              </div>
            ) : isDirect ? (
              <Button
                className="bg-success text-success-foreground hover:bg-success/90"
                onClick={handleAcceptDirect}
                disabled={processing}
              >
                {processing ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 me-2" />}
                {isRTL ? 'قبول الطلب' : 'Accept Request'}
              </Button>
            ) : (
              <Button
                className="bg-gradient-gold text-gold-foreground hover:opacity-90"
                onClick={() => navigate({ to: '/office/submit-offer/$id', params: { id: req.request_id } })}
              >
                <Send className="h-4 w-4 me-2" />
                {isRTL ? 'تقديم عرض' : 'Submit Bid'}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
