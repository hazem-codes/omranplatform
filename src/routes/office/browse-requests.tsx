import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { projectRequestService } from '@/services/projectRequestService';
import { bidService } from '@/services/bidService';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, MapPin, DollarSign, Eye, CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SAUDI_CITIES } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { decodeLocation } from '@/lib/locationCodec';

export const Route = createFileRoute('/office/browse-requests')({
 component: BrowseRequestsPage,
});

function BrowseRequestsPage() {
 const { i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const Arrow = isRTL ? ArrowRight : ArrowLeft;
 const navigate = useNavigate();
 const { user } = useAuth();
 const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');
 const [requests, setRequests] = useState<any[]>([]);
 const [loadingRequests, setLoadingRequests] = useState(false);
 const [requestsError, setRequestsError] = useState<string | null>(null);
 const [filterCity, setFilterCity] = useState('all');
  const [bidTarget, setBidTarget] = useState<any | null>(null);
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

  const safeRequests = Array.isArray(approvedRequests)
 ? approvedRequests
 .filter((r: any) => r && r.request_id)
 .map((r: any) => {
 const loc = decodeLocation(r.location);
 return {
 ...r,
 title: r.title || (isRTL ? 'طلب بدون عنوان' : 'Untitled request'),
 description: r.description || '',
 location: loc.city || '-',
 _coords: loc.latitude != null && loc.longitude != null
 ? { lat: loc.latitude, lng: loc.longitude }
 : null,
 _formattedAddress: loc.formattedAddress || '',
 budget_range: typeof r.budget_range === 'string' ? r.budget_range : '',
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
 }, [allowed, user?.id]);

 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 // Filter: hide requests targeted to OTHER offices; show requests targeted to ME or open to all
 const visibleRequests = requests.filter(r => {
 if (!r.target_office_id) return true; // custom request — visible to all
 return r.target_office_id === user?.id; // ready-service — only owner office
 });
 const filtered = filterCity && filterCity !== 'all' ? visibleRequests.filter(r => r.location === filterCity) : visibleRequests;

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
 } catch (err: any) { toast.error(err.message); }
 finally { setSubmittingBid(false); }
 };

 const handleAcceptDirect = async (req: any) => {
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
 } catch (err: any) { toast.error(err.message); }
 finally { setProcessingId(null); }
 };

 const isDirectBooking = (req: any) => !!req.target_office_id;

 return (
 <div className="mx-auto max-w-5xl px-4 py-8">
 <div className="mb-4">
 <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/office/home' })}>
 <Arrow className="h-4 w-4 me-1" />
 {isRTL ? 'العودة' : 'Back'}
 </Button>
 </div>
 <h1 className="text-2xl font-black mb-2">{isRTL ? 'تصفح طلبات المشاريع المعتمدة' : 'Browse Approved Project Requests'}</h1>
 <p className="text-muted-foreground mb-6">{isRTL ? 'قدّم عرضك على المشاريع المتاحة' : 'Submit your bid on available projects'}</p>

 <div className="flex gap-4 mb-6">
 <Select value={filterCity} onValueChange={setFilterCity}>
 <SelectTrigger className="w-48"><SelectValue placeholder={isRTL ? 'كل المدن' : 'All Cities'} /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
 {SAUDI_CITIES.map(c => (
 <SelectItem key={c.ar} value={c.ar}>{isRTL ? c.ar : c.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-3">
 {loadingRequests ? (
 <div className="flex items-center justify-center rounded-xl border bg-card py-12 text-muted-foreground">
 <Loader2 className="h-4 w-4 animate-spin me-2" />
 {isRTL ? 'جاري تحميل الطلبات...' : 'Loading requests...'}
 </div>
 ) : requestsError ? (
 <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
 <p className="text-sm text-destructive">{requestsError}</p>
 <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
 {isRTL ? 'إعادة المحاولة' : 'Retry'}
 </Button>
 </div>
 ) : filtered.length === 0 ? (
 <p className="text-center text-muted-foreground py-12">{isRTL ? 'لا توجد طلبات حالياً' : 'No requests available'}</p>
 ) : (
 filtered.map(req => {
 const existingBid = myBids[req.request_id];
 const isDirect = isDirectBooking(req);
 return (
 <div key={req.request_id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-lg">{req.title}</h3>
 {isDirect && (
 <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold">
 {isRTL ? 'حجز مباشر' : 'Direct Booking'}
 </span>
 )}
 </div>
 <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
 <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
 <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{req.location}</span>
 <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{req.budget_range}</span>
 </div>
 </div>
 <div className="flex flex-col gap-2 ms-4">
   <Button size="sm" variant="outline" onClick={() => navigate({ to: '/office/requests/$id', params: { id: req.request_id } })}>
   <Eye className="h-3 w-3 me-1" />
   {isRTL ? 'التفاصيل' : 'Details'}
   </Button>
 {existingBid ? (
 <StatusBadge status={existingBid.status || 'submitted'} />
 ) : isDirect ? (
 /* Ready-service: accept/reject instead of bid */
 <div className="flex flex-col gap-1">
 <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => handleAcceptDirect(req)} disabled={processingId === req.request_id}>
 {processingId === req.request_id ? <Loader2 className="h-3 w-3 me-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 me-1" />}
 {isRTL ? 'قبول' : 'Accept'}
 </Button>
 </div>
                 ) : (
 /* Custom request: submit bid */
 <Button size="sm" className="bg-gradient-gold text-gold-foreground hover:opacity-90" onClick={() => navigate({ to: '/office/submit-offer/$id', params: { id: req.request_id } })}>
 <Send className="h-3 w-3 me-1" />
 {isRTL ? 'قدّم عرضك' : 'Submit Bid'}
 </Button>
 )}
 </div>
 </div>
 </div>
 );
 })
 )}
  </div>


 {/* Bid Modal (custom requests only) */}
 <Dialog open={!!bidTarget} onOpenChange={() => setBidTarget(null)}>
 <DialogContent className="max-w-md">
 <DialogHeader><DialogTitle>{isRTL ? 'تقديم عرض' : 'Submit Bid'}</DialogTitle></DialogHeader>
 <div className="space-y-4">
 <div className="p-3 rounded-lg bg-muted/30">
 <p className="font-bold text-sm">{bidTarget?.title}</p>
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
