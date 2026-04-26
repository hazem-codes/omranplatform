import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { projectRequestService } from '@/services/projectRequestService';
import { bidService } from '@/services/bidService';
import { templatePurchaseService } from '@/services/templatePurchaseService';
import { StatusBadge } from '@/components/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Eye, FileText, ShoppingBag, Briefcase, Download, ExternalLink } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { SERVICE_CATEGORIES_DATA, type ServiceCategory } from '@/types';

type SearchParams = { tab?: string };

export const Route = createFileRoute('/client/my-requests')({
 validateSearch: (search: Record<string, unknown>): SearchParams => ({
 tab: typeof search.tab === 'string' ? search.tab : undefined,
 }),
 component: MyRequestsPage,
});

function MyRequestsPage() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const { user } = useAuth();
 const { allowed, isLoading: guardLoading } = useAuthGuard('client');
 const search = useSearch({ from: '/client/my-requests' }) as SearchParams;

 const [requests, setRequests] = useState<any[]>([]);
 const [bidCounts, setBidCounts] = useState<Record<string, number>>({});
 const [purchases, setPurchases] = useState<any[]>([]);
 const [purchasesError, setPurchasesError] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<string>(search.tab || 'all');

 useEffect(() => {
 if (!user?.id || !allowed) return;
 projectRequestService.getByClient(user.id).then(async (reqs) => {
 setRequests(reqs ?? []);
 const counts: Record<string, number> = {};
 for (const req of (reqs ?? [])) {
 if (req.status === 'approved') {
 try {
 const bids = await bidService.getBidsForRequest(req.request_id);
 counts[req.request_id] = (bids ?? []).filter((b: any) => b.status === 'submitted').length;
 } catch { counts[req.request_id] = 0; }
 }
 }
 setBidCounts(counts);
 }).catch(() => {});

 templatePurchaseService.getByClient(user.id)
 .then((data) => { setPurchases(data); setPurchasesError(null); })
 .catch((err) => {
 setPurchases([]);
 const msg = err?.message || '';
 if (msg.includes('template_purchases') || msg.toLowerCase().includes('does not exist') || msg.includes('relation')) {
 setPurchasesError('missing_table');
 }
 });
 }, [user?.id, allowed]);

 const projectRequests = useMemo(() => requests.filter(r => r.status !== 'direct_booking'), [requests]);
 const serviceRequests = useMemo(() => requests.filter(r => r.status === 'direct_booking'), [requests]);

 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 const sar = isRTL ? 'ر.س' : 'SAR';

 const renderRequestCard = (req: any, type: 'project' | 'service') => {
 const bCount = bidCounts[req.request_id] ?? 0;
 return (
 <div key={req.request_id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <Badge variant="outline" className="text-[10px]">
 {type === 'project'
 ? (isRTL ? 'طلب مشروع' : 'Project Request')
 : (isRTL ? 'طلب خدمة' : 'Service Request')}
 </Badge>
 </div>
 <h3 className="font-bold truncate">{req.title}</h3>
 <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{req.description}</p>
 <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
 {req.location && <span> {req.location}</span>}
 {req.budget_range && <span> {req.budget_range}</span>}
 {req.created_at && <span> {new Date(req.created_at).toLocaleDateString()}</span>}
 </div>
 </div>
 <div className="flex flex-col items-end gap-2 shrink-0">
 <StatusBadge status={req.status || 'pending'} />
 {req.status === 'approved' && bCount > 0 && (
 <>
 <Badge variant="secondary">{bCount} {isRTL ? 'عروض' : 'bids'}</Badge>
 <Link to="/client/bid-comparison" search={{ request_id: req.request_id } as any}>
 <Button size="sm" variant="outline">
 <Eye className="h-3 w-3 me-1" />
 {isRTL ? 'مقارنة العروض' : 'Compare Bids'}
 </Button>
 </Link>
 </>
 )}
 </div>
 </div>
 </div>
 );
 };

 const renderPurchaseCard = (p: any) => {
 const cat = SERVICE_CATEGORIES_DATA[p.category_snapshot as ServiceCategory];
 return (
 <div key={p.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
 <div className="flex items-start justify-between gap-4">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <Badge variant="outline" className="text-[10px]">{isRTL ? 'قالب مُشترى' : 'Purchased Template'}</Badge>
 {cat && (
 <Badge variant="secondary" className="text-[10px]">{isRTL ? cat.ar : cat.en}</Badge>
 )}
 </div>
 <h3 className="font-bold truncate">{p.title_snapshot || (isRTL ? 'قالب' : 'Template')}</h3>
 <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
 <span> {Number(p.purchase_price ?? 0).toLocaleString()} {sar}</span>
 {p.created_at && <span> {new Date(p.created_at).toLocaleDateString()}</span>}
 </div>
 </div>
 <div className="flex flex-col items-end gap-2 shrink-0">
 <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20" variant="outline">
 {p.status === 'delivered' ? (isRTL ? 'تم التسليم' : 'Delivered') : p.status === 'cancelled' ? (isRTL ? 'ملغي' : 'Cancelled') : (isRTL ? 'مدفوع' : 'Paid')}
 </Badge>
 {p.file_url_snapshot ? (
 <a href={p.file_url_snapshot} target="_blank" rel="noopener noreferrer">
 <Button size="sm" variant="outline">
 <Download className="h-3 w-3 me-1" />{isRTL ? 'تنزيل' : 'Download'}
 </Button>
 </a>
 ) : (
 <Button size="sm" variant="outline" disabled>
 <ExternalLink className="h-3 w-3 me-1" />{isRTL ? 'بانتظار التسليم' : 'Pending file'}
 </Button>
 )}
 </div>
 </div>
 </div>
 );
 };

 const allItems = [
 ...projectRequests.map(r => ({ kind: 'project', date: r.created_at, node: renderRequestCard(r, 'project') })),
 ...serviceRequests.map(r => ({ kind: 'service', date: r.created_at, node: renderRequestCard(r, 'service') })),
 ...purchases.map(p => ({ kind: 'purchase', date: p.created_at, node: renderPurchaseCard(p) })),
 ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

 const empty = (label: string) => (
 <p className="text-center text-muted-foreground py-12">{label}</p>
 );

 return (
 <div className="mx-auto max-w-5xl px-4 py-8">
 <h1 className="text-2xl font-black mb-2">{isRTL ? 'طلباتي' : 'My Orders'}</h1>
 <p className="text-sm text-muted-foreground mb-6">
 {isRTL ? 'كل طلبات المشاريع والخدمات والقوالب المشتراة في مكان واحد' : 'All your project requests, service requests, and purchased templates in one place'}
 </p>

 {purchasesError === 'missing_table' && (
 <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
 {isRTL
 ? 'قسم القوالب المشتراة معطّل: شغّل ملف public/marketplace_setup.sql في محرر SQL الخاص بـ Supabase.'
 : 'Purchased Templates is disabled: run public/marketplace_setup.sql in your Supabase SQL Editor.'}
 </div>
 )}

 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="mb-4 grid w-full grid-cols-4">
 <TabsTrigger value="all">{isRTL ? 'الكل' : 'All'} ({allItems.length})</TabsTrigger>
 <TabsTrigger value="projects">
 <FileText className="h-3.5 w-3.5 me-1" />{isRTL ? 'طلبات المشاريع' : 'Project Requests'} ({projectRequests.length})
 </TabsTrigger>
 <TabsTrigger value="services">
 <Briefcase className="h-3.5 w-3.5 me-1" />{isRTL ? 'طلبات الخدمات' : 'Service Requests'} ({serviceRequests.length})
 </TabsTrigger>
 <TabsTrigger value="templates">
 <ShoppingBag className="h-3.5 w-3.5 me-1" />{isRTL ? 'القوالب المشتراة' : 'Purchased Templates'} ({purchases.length})
 </TabsTrigger>
 </TabsList>

 <TabsContent value="all" className="space-y-3">
 {allItems.length === 0 ? empty(t('common.no_data')) : allItems.map((it, i) => <div key={i}>{it.node}</div>)}
 </TabsContent>
 <TabsContent value="projects" className="space-y-3">
 {projectRequests.length === 0 ? empty(t('common.no_data')) : projectRequests.map(r => renderRequestCard(r, 'project'))}
 </TabsContent>
 <TabsContent value="services" className="space-y-3">
 {serviceRequests.length === 0 ? empty(t('common.no_data')) : serviceRequests.map(r => renderRequestCard(r, 'service'))}
 </TabsContent>
 <TabsContent value="templates" className="space-y-3">
 {purchases.length === 0 ? empty(isRTL ? 'لم تشترِ أي قالب بعد' : 'No purchased templates yet') : purchases.map(renderPurchaseCard)}
 </TabsContent>
 </Tabs>
 </div>
 );
}
