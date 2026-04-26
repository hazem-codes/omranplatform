import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { projectRequestService } from '@/services/projectRequestService';
import { bidService } from '@/services/bidService';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/bids')({
 component: BidsPage,
});

function BidsPage() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const { user } = useAuth();
 const { allowed, isLoading: guardLoading } = useAuthGuard('client');
 const [requests, setRequests] = useState<any[]>([]);
 const [bidCounts, setBidCounts] = useState<Record<string, number>>({});
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (!allowed || !user?.id) return;
 setLoading(true);
 projectRequestService.getByClient(user.id).then(async (reqs) => {
 setRequests(reqs ?? []);
 const counts: Record<string, number> = {};
 for (const req of (reqs ?? [])) {
 if (req.status === 'approved') {
 try {
 const bids = await bidService.getBidsForRequest(req.request_id);
 counts[req.request_id] = (bids ?? []).length;
 } catch { counts[req.request_id] = 0; }
 }
 }
 setBidCounts(counts);
 }).catch(() => {}).finally(() => setLoading(false));
 }, [allowed, user?.id]);

 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 const approvedWithBids = requests.filter(r => r.status === 'approved' && (bidCounts[r.request_id] ?? 0) > 0);

 return (
 <div className="mx-auto max-w-5xl px-4 py-8">
 <h1 className="text-2xl font-black mb-2">{t('bids.compare')}</h1>
 <p className="text-muted-foreground mb-6">{isRTL ? 'طلباتك التي وردت عليها عروض من المكاتب الهندسية' : 'Your requests that received bids from engineering offices'}</p>

 {loading ? (
 <p className="text-center text-muted-foreground py-12">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
 ) : approvedWithBids.length === 0 ? (
 <p className="text-center text-muted-foreground py-12">{isRTL ? 'لا توجد عروض حالياً على طلباتك' : 'No bids received on your requests yet'}</p>
 ) : (
 <div className="space-y-3">
 {approvedWithBids.map(req => (
 <div key={req.request_id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <h3 className="font-bold text-lg">{req.title}</h3>
 <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
 <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
 <span> {req.location}</span>
 <span> {req.budget_range}</span>
 </div>
 </div>
 <div className="flex flex-col items-end gap-2 ms-4">
 <Badge variant="secondary">{bidCounts[req.request_id]} {isRTL ? 'عروض' : 'bids'}</Badge>
 <Link to="/client/bid-comparison" search={{ request_id: req.request_id }}>
 <Button size="sm" className="bg-gradient-gold text-gold-foreground hover:opacity-90">
 <Eye className="h-3 w-3 me-1" />
 {isRTL ? 'عرض ومقارنة' : 'View & Compare'}
 </Button>
 </Link>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
