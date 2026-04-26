import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { projectRequestService } from '@/services/projectRequestService';
import { bidService } from '@/services/bidService';
import { messagingService } from '@/services/messagingService';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Send, MapPin, Wallet, Eye, CheckCircle2, XCircle, MessageCircleQuestion, Calendar, Ruler, Briefcase, Inbox, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SAUDI_CITIES, SERVICE_CATEGORIES_DATA, type ServiceCategory } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { decodeLocation } from '@/lib/locationCodec';
import {
  cleanRequestTitle,
  parseRequestMeta,
  getCategoryLabel,
  getSubCategoryLabel,
} from '@/lib/projectRequestParser';

export const Route = createFileRoute('/office/browse-requests')({
  component: BrowseRequestsPage,
});

type EnrichedRequest = {
  request_id: string;
  client_id?: string | null;
  target_office_id?: string | null;
  status?: string | null;
  created_at?: string | null;
  budget_range?: string | null;
  rawTitle: string;
  cleanTitle: string;
  description: string;
  location: string;
  formattedAddress: string;
  categoryKey?: string;
  subCategoryKey?: string;
  area?: string;
  timeline?: string;
};

function BrowseRequestsPage() {
  const { i18n } = useTranslation();
  const lang = (i18n.language === 'ar' ? 'ar' : 'en') as 'ar' | 'en';
  const isRTL = lang === 'ar';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState('all');
  const [filterCategory, setFilterCategory] = useState<'all' | ServiceCategory>('all');
  const [activeTab, setActiveTab] = useState<'broadcast' | 'direct'>('broadcast');
  const [bidTarget, setBidTarget] = useState<EnrichedRequest | null>(null);
  const [bidForm, setBidForm] = useState({ price: '', timeline: '', notes: '' });
  const [myBids, setMyBids] = useState<Record<string, any>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [submittingBid, setSubmittingBid] = useState(false);
  const sar = isRTL ? 'ر.س' : 'SAR';

  useEffect(() => {
    if (!allowed || !user?.id) return;

    let cancelled = false;
    const load = async () => {
      setLoadingRequests(true);
      setRequestsError(null);
      try {
        const [approvedRequests, bids] = await Promise.all([
          projectRequestService.getApproved(),
          bidService.getByOffice(user.id),
        ]);

        if (cancelled) return;

        const safeRequests: EnrichedRequest[] = Array.isArray(approvedRequests)
          ? approvedRequests
              .filter((r: any) => r && r.request_id)
              .map((r: any) => {
                const loc = decodeLocation(r.location);
                const meta = parseRequestMeta(r.description);
                return {
                  request_id: r.request_id,
                  client_id: r.client_id,
                  target_office_id: r.target_office_id,
                  status: r.status,
                  created_at: r.created_at,
                  budget_range: typeof r.budget_range === 'string' ? r.budget_range : '',
                  rawTitle: r.title || '',
                  cleanTitle:
                    cleanRequestTitle(r.title) ||
                    (isRTL ? 'طلب بدون عنوان' : 'Untitled request'),
                  description: meta.cleanDescription,
                  location: loc.city || '-',
                  formattedAddress: loc.formattedAddress || '',
                  categoryKey: meta.categoryKey,
                  subCategoryKey: meta.subCategoryKey,
                  area: meta.area,
                  timeline: meta.timeline,
                };
              })
          : [];

        setRequests(safeRequests);

        const map: Record<string, any> = {};
        for (const b of (Array.isArray(bids) ? bids : [])) {
          if (b?.request_id && b.status !== 'withdrawn') {
            map[b.request_id] = b;
          }
        }
        setMyBids(map);
      } catch {
        if (!cancelled) {
          setRequests([]);
          setRequestsError(isRTL ? 'تعذر تحميل الطلبات حالياً' : 'Failed to load requests right now');
        }
      } finally {
        if (!cancelled) setLoadingRequests(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [allowed, user?.id, isRTL]);

  // Hide requests targeted to OTHER offices
  const visibleRequests = useMemo(
    () =>
      requests.filter(r => {
        if (!r.target_office_id) return true;
        return r.target_office_id === user?.id;
      }),
    [requests, user?.id],
  );

  const filtered = useMemo(() => {
    return visibleRequests.filter(r => {
      if (filterCity !== 'all' && r.location !== filterCity) return false;
      if (filterCategory !== 'all' && r.categoryKey !== filterCategory) return false;
      return true;
    });
  }, [visibleRequests, filterCity, filterCategory]);

  const broadcastRequests = useMemo(() => filtered.filter(r => !r.target_office_id), [filtered]);
  const directRequests = useMemo(() => filtered.filter(r => !!r.target_office_id), [filtered]);

  if (!allowed) {
    return guardLoading ? (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="text-muted-foreground">جاري التحقق...</span>
      </div>
    ) : null;
  }

  const submitBid = async () => {
    if (!user?.id || !bidTarget || !bidForm.price || !bidForm.timeline) return;
    try {
      setSubmittingBid(true);
      await bidService.submitBid({
        request_id: bidTarget.request_id,
        office_id: user.id,
        price: parseFloat(bidForm.price),
        timeline: parseInt(bidForm.timeline),
      });
      toast.success(isRTL ? 'تم تقديم العرض بنجاح' : 'Bid submitted successfully');
      setMyBids(prev => ({ ...prev, [bidTarget.request_id]: { status: 'submitted' } }));
      setBidTarget(null);
      setBidForm({ price: '', timeline: '', notes: '' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleAcceptDirect = async (req: EnrichedRequest) => {
    try {
      setProcessingId(req.request_id);
      await bidService.submitBid({
        request_id: req.request_id,
        office_id: user!.id,
        price: parseFloat(req.budget_range?.replace(/[^\d.]/g, '') || '0'),
        timeline: 30,
      });
      toast.success(isRTL ? 'تم قبول الطلب' : 'Request accepted');
      setMyBids(prev => ({ ...prev, [req.request_id]: { status: 'submitted' } }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectDirect = async (req: EnrichedRequest) => {
    try {
      setProcessingId(req.request_id);
      await projectRequestService.updateStatus(req.request_id, 'rejected');
      toast.success(isRTL ? 'تم رفض الطلب' : 'Request rejected');
      // Remove from view
      setRequests(prev => prev.filter(r => r.request_id !== req.request_id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleClarify = (req: EnrichedRequest) => {
    if (!req.client_id) {
      toast.error(isRTL ? 'العميل غير متاح' : 'Client unavailable');
      return;
    }
    navigate({ to: '/office/chat/$id', params: { id: req.client_id } });
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const renderCard = (req: EnrichedRequest) => {
    const existingBid = myBids[req.request_id];
    const isDirect = !!req.target_office_id;
    const categoryLabel = getCategoryLabel(req.categoryKey, lang);
    const subLabel = getSubCategoryLabel(req.categoryKey, req.subCategoryKey, lang);
    const statusKey = isDirect ? 'direct_booking' : (req.status || 'pending');

    return (
      <div key={req.request_id} className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 min-w-0">
            {/* Title + status */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-lg leading-tight">{req.cleanTitle}</h3>
              <StatusBadge status={statusKey} />
            </div>

            {/* Category chips */}
            {(categoryLabel || subLabel) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categoryLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold">
                    <Briefcase className="h-3 w-3" />
                    {categoryLabel}
                  </span>
                )}
                {subLabel && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    {subLabel}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {req.description && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2 whitespace-pre-line">
                {req.description}
              </p>
            )}

            {/* Meta grid */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground sm:grid-cols-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gold/70" />
                <span className="truncate">{req.location}</span>
              </span>
              {req.area && (
                <span className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-gold/70" />
                  <span className="truncate">{req.area} {isRTL ? 'م²' : 'm²'}</span>
                </span>
              )}
              {req.budget_range && (
                <span className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-gold/70" />
                  <span className="truncate">{req.budget_range} {sar}</span>
                </span>
              )}
              {req.created_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gold/70" />
                  <span className="truncate">{formatDate(req.created_at)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-row md:flex-col gap-2 md:ms-4 md:w-44 md:shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 md:flex-none"
              onClick={() => navigate({ to: '/office/requests/$id', params: { id: req.request_id } })}
            >
              <Eye className="h-3 w-3 me-1" />
              {isRTL ? 'التفاصيل' : 'Details'}
            </Button>

            {existingBid ? (
              <div className="flex-1 md:flex-none flex items-center justify-center rounded-md border bg-muted/30 px-3 py-1.5">
                <StatusBadge status={existingBid.status || 'submitted'} />
              </div>
            ) : isDirect ? (
              <>
                <Button
                  size="sm"
                  className="flex-1 md:flex-none bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => handleAcceptDirect(req)}
                  disabled={processingId === req.request_id}
                >
                  {processingId === req.request_id ? (
                    <Loader2 className="h-3 w-3 me-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 me-1" />
                  )}
                  {isRTL ? 'قبول' : 'Accept'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 md:flex-none"
                  onClick={() => handleClarify(req)}
                >
                  <MessageCircleQuestion className="h-3 w-3 me-1" />
                  {isRTL ? 'طلب توضيح' : 'Clarify'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 md:flex-none"
                  onClick={() => handleRejectDirect(req)}
                  disabled={processingId === req.request_id}
                >
                  <XCircle className="h-3 w-3 me-1" />
                  {isRTL ? 'رفض' : 'Reject'}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="flex-1 md:flex-none bg-gradient-gold text-gold-foreground hover:opacity-90"
                onClick={() => navigate({ to: '/office/submit-offer/$id', params: { id: req.request_id } })}
              >
                <Send className="h-3 w-3 me-1" />
                {isRTL ? 'قدّم عرضك' : 'Submit Bid'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEmpty = (msg: string) => (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 py-16 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );

  const renderList = (items: EnrichedRequest[], emptyMsg: string) => {
    if (loadingRequests) {
      return (
        <div className="flex items-center justify-center rounded-2xl border bg-card py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin me-2" />
          {isRTL ? 'جاري تحميل الطلبات...' : 'Loading requests...'}
        </div>
      );
    }
    if (requestsError) {
      return (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-destructive">{requestsError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      );
    }
    if (items.length === 0) return renderEmpty(emptyMsg);
    return <div className="space-y-3">{items.map(renderCard)}</div>;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/office/home' })}>
          <Arrow className="h-4 w-4 me-1" />
          {isRTL ? 'العودة' : 'Back'}
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black">
          {isRTL ? 'الطلبات المتاحة' : 'Available Requests'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isRTL
            ? 'تصفح طلبات المشاريع المعتمدة وحجوزات الخدمات الموجهة لمكتبك'
            : 'Browse approved projects and direct service requests for your office'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filterCity} onValueChange={setFilterCity}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={isRTL ? 'كل المدن' : 'All Cities'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? 'كل المدن' : 'All Cities'}</SelectItem>
            {SAUDI_CITIES.map(c => (
              <SelectItem key={c.ar} value={c.ar}>{isRTL ? c.ar : c.en}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as 'all' | ServiceCategory)}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder={isRTL ? 'كل التخصصات' : 'All Categories'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? 'كل التخصصات' : 'All Categories'}</SelectItem>
            {(Object.keys(SERVICE_CATEGORIES_DATA) as ServiceCategory[]).map(key => (
              <SelectItem key={key} value={key}>
                {SERVICE_CATEGORIES_DATA[key][lang]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs: Broadcast vs Direct */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'broadcast' | 'direct')} className="w-full">
        <TabsList className="h-auto p-1">
          <TabsTrigger value="broadcast" className="px-4 py-2">
            {isRTL ? 'طلبات مفتوحة' : 'Open Projects'}
            <span className="ms-2 rounded-full bg-muted-foreground/15 px-2 py-0.5 text-[10px] font-bold">
              {broadcastRequests.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="direct" className="px-4 py-2">
            {isRTL ? 'طلبات حجز مباشر' : 'Direct Bookings'}
            <span className="ms-2 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              {directRequests.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast" className="mt-4">
          {renderList(
            broadcastRequests,
            isRTL ? 'لا توجد طلبات مفتوحة حالياً' : 'No open projects at the moment',
          )}
        </TabsContent>

        <TabsContent value="direct" className="mt-4">
          {renderList(
            directRequests,
            isRTL ? 'لا توجد طلبات حجز مباشر' : 'No direct bookings',
          )}
        </TabsContent>
      </Tabs>

      {/* Bid Modal (kept for any legacy callers; primary flow uses /office/submit-offer/$id) */}
      <Dialog open={!!bidTarget} onOpenChange={() => setBidTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isRTL ? 'تقديم عرض' : 'Submit Bid'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="font-bold text-sm">{bidTarget?.cleanTitle}</p>
              <p className="text-xs text-muted-foreground">{bidTarget?.location} • {bidTarget?.budget_range}</p>
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'السعر' : 'Price'} ({sar})</Label>
              <Input type="number" value={bidForm.price} onChange={e => setBidForm(f => ({ ...f, price: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'المدة (أيام)' : 'Timeline (days)'}</Label>
              <Input type="number" value={bidForm.timeline} onChange={e => setBidForm(f => ({ ...f, timeline: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea value={bidForm.notes} onChange={e => setBidForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
            <Button className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" onClick={submitBid} disabled={submittingBid || !bidForm.price || !bidForm.timeline}>
              {submittingBid ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Send className="h-4 w-4 me-2" />}
              {submittingBid ? (isRTL ? 'جارٍ الإرسال...' : 'Submitting...') : (isRTL ? 'تقديم العرض' : 'Submit Bid')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
