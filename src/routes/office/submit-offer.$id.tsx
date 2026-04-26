import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { supervisorService } from '@/services/supervisorService';
import { bidService } from '@/services/bidService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { decodeLocation } from '@/lib/locationCodec';

export const Route = createFileRoute('/office/submit-offer/$id')({
  component: SubmitOfferPage,
});

function SubmitOfferPage() {
  const { id } = useParams({ from: '/office/submit-offer/$id' });
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const sar = isRTL ? 'ر.س' : 'SAR';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');

  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ price: '', timeline: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await supervisorService.getProjectRequestById(id);
        if (cancelled) return;
        if (data) {
          const loc = decodeLocation(data.location);
          setReq({ ...data, _city: loc.city || '-' });
        }
      } catch (e: any) {
        toast.error(e?.message || (isRTL ? 'فشل تحميل البيانات' : 'Failed to load'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, allowed]);

  if (!allowed) {
    return guardLoading
      ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div>
      : null;
  }

  const handleSubmit = async () => {
    if (!user?.id || !req || !form.price || !form.timeline) return;
    try {
      setSubmitting(true);
      await bidService.submitBid({
        request_id: req.request_id,
        office_id: user.id,
        price: parseFloat(form.price),
        timeline: parseInt(form.timeline),
      });
      toast.success(isRTL ? 'تم تقديم العرض بنجاح' : 'Bid submitted successfully');
      navigate({ to: '/office/requests/$id', params: { id } });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black">{isRTL ? 'قدم عرضك' : 'Submit Your Offer'}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/office/requests/$id', params: { id } })}
          >
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
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
            <div className="p-3 rounded-lg bg-muted/40">
              <p className="font-bold text-sm">{req.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {req._city}{req.budget_range ? ` • ${req.budget_range}` : ''}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'السعر' : 'Price'} ({sar})</Label>
              <Input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'المدة (أيام)' : 'Timeline (days)'}</Label>
              <Input
                type="number"
                value={form.timeline}
                onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={4}
              />
            </div>

            <Button
              className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90"
              onClick={handleSubmit}
              disabled={submitting || !form.price || !form.timeline}
            >
              {submitting ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Send className="h-4 w-4 me-2" />}
              {submitting ? (isRTL ? 'جارٍ الإرسال...' : 'Submitting...') : (isRTL ? 'تقديم العرض' : 'Submit Offer')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
