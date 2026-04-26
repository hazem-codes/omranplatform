import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { bidService } from '@/services/bidService';
import { messagingService } from '@/services/messagingService';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { CheckCircle2, XCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/bid-comparison')({
  validateSearch: (search: Record<string, unknown>) => ({
    request_id: (search.request_id as string) || '',
  }),
  component: BidComparisonPage,
});

function BidComparisonPage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const sar = isRTL ? 'ر.س' : 'SAR';
  const { allowed, isLoading: guardLoading } = useAuthGuard('client');
  const { request_id } = Route.useSearch();
  const [bids, setBids] = useState<any[]>([]);
  const [officeNames, setOfficeNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadBids = async () => {
    if (!request_id) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await bidService.getBidsForRequest(request_id);
      const bidList = data ?? [];
      setBids(bidList);

      // Enrich with office names so the office column links to the public profile.
      const officeIds = Array.from(new Set(bidList.map((b: any) => b.office_id).filter(Boolean)));
      if (officeIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', officeIds);
        const map: Record<string, string> = {};
        for (const p of (profs ?? [])) map[p.id] = p.name || '';
        setOfficeNames(map);
      } else {
        setOfficeNames({});
      }
    } catch { setBids([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (allowed) loadBids();
  }, [allowed, request_id]);

  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  const handleAccept = async (bidId: string) => {
    try {
      setProcessingId(bidId);
      await bidService.acceptBid(bidId);
      toast.success(isRTL ? 'تم قبول العرض' : 'Bid accepted');
      await loadBids();
    } catch (err: any) { toast.error(err.message); }
    finally { setProcessingId(null); }
  };

  const handleReject = async (bidId: string) => {
    try {
      setProcessingId(bidId);
      await bidService.rejectBid(bidId);
      toast.success(isRTL ? 'تم رفض العرض' : 'Bid rejected');
      await loadBids();
    } catch (err: any) { toast.error(err.message); }
    finally { setProcessingId(null); }
  };

  if (!request_id) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-center text-muted-foreground py-12">{isRTL ? 'لم يتم تحديد طلب' : 'No request selected'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">{isRTL ? 'مقارنة العروض' : 'Bid Comparison'}</h1>

      <Card className="mt-6">
        <CardContent className="pt-6 overflow-x-auto">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : bids.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{isRTL ? 'لا توجد عروض لهذا الطلب' : 'No bids for this request'}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? 'المكتب' : 'Office'}</TableHead>
                  <TableHead>{isRTL ? 'السعر' : 'Price'}</TableHead>
                  <TableHead>{isRTL ? 'المدة (أيام)' : 'Timeline (days)'}</TableHead>
                  <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{isRTL ? 'إجراء' : 'Action'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map(b => {
                  const officeName = officeNames[b.office_id] || (isRTL ? 'مكتب هندسي' : 'Engineering Office');
                  return (
                  <TableRow key={b.bid_id}>
                    <TableCell className="font-medium">
                      {b.office_id ? (
                        <Link
                          to="/client/office/$id"
                          params={{ id: b.office_id }}
                          className="inline-flex items-center gap-2 group/office hover:opacity-90"
                          aria-label={isRTL ? 'عرض صفحة المكتب' : 'View office page'}
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-navy text-white text-xs font-bold shrink-0">
                            {officeName.charAt(0).toUpperCase() || '?'}
                          </span>
                          <span className="truncate text-gold underline-offset-2 group-hover/office:underline">
                            {officeName}
                          </span>
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />-
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{b.price?.toLocaleString()} {sar}</TableCell>
                    <TableCell>{b.timeline} {isRTL ? 'يوم' : 'days'}</TableCell>
                    <TableCell><StatusBadge status={b.status || 'submitted'} /></TableCell>
                    <TableCell>
                      {(b.status === 'submitted' || !b.status) && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="bg-success text-success-foreground"
                            onClick={() => handleAccept(b.bid_id)}
                            disabled={processingId === b.bid_id}
                          >
                            <CheckCircle2 className="me-1 h-3 w-3" />
                            {isRTL ? 'قبول' : 'Accept'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(b.bid_id)}
                            disabled={processingId === b.bid_id}
                          >
                            <XCircle className="me-1 h-3 w-3" />
                            {isRTL ? 'رفض' : 'Reject'}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
