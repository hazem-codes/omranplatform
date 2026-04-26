import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { projectRequestService } from '@/services/projectRequestService';
import { bidService } from '@/services/bidService';
import { Briefcase, FileText, Clock, Plus, Search, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/dashboard')({
 component: ClientDashboard,
});

function ClientDashboard() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const { user } = useAuth();
 const { allowed, isLoading: guardLoading } = useAuthGuard('client');
 const [requests, setRequests] = useState<any[]>([]);
 const [totalBids, setTotalBids] = useState(0);

 useEffect(() => {
 if (!user?.id || !allowed) return;
 projectRequestService.getByClient(user.id).then(async (reqs) => {
 setRequests(reqs ?? []);
 // Count real bids across approved requests
 let count = 0;
 for (const req of (reqs ?? [])) {
 if (req.status === 'approved') {
 try {
 const bids = await bidService.getBidsForRequest(req.request_id);
 count += (bids ?? []).filter((b: any) => b.status === 'submitted').length;
 } catch {}
 }
 }
 setTotalBids(count);
 }).catch(() => {});
 }, [user?.id, allowed]);

 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 const activeCount = requests.filter(r => r.status === 'approved' || r.status === 'active').length;
 const pendingCount = requests.filter(r => r.status === 'pending').length;

 return (
 <div className="mx-auto max-w-7xl px-4 py-8">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h1 className="text-3xl font-black">{t('dashboard.welcome')}، {user?.name}</h1>
 <p className="text-muted-foreground mt-1">{t('dashboard.overview')}</p>
 </div>
 </div>

 {/* Two main CTA cards */}
 <div className="grid gap-4 md:grid-cols-3 mb-8">
 <Link to="/client/catalog">
 <div className="group rounded-2xl border-2 border-gold/30 bg-gradient-to-br from-gold/5 to-gold/10 p-8 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
 <ShoppingCart className="h-10 w-10 text-gold mb-3" />
 <h3 className="text-lg font-black">{isRTL ? 'خدمات المكاتب الهندسية ' : 'Engineering Office Services '}</h3>
 <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'خدمات حسب طلبك مع حجز مباشر' : 'Project-specific services with direct booking'}</p>
 </div>
 </Link>
 <Link to="/client/templates">
 <div className="group rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-purple-500/10 p-8 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
 <Briefcase className="h-10 w-10 text-purple-600 mb-3" />
 <h3 className="text-lg font-black">{isRTL ? 'قوالب هندسية جاهزة ' : 'Ready-made Engineering Templates '}</h3>
 <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'نماذج جاهزة للشراء والاستخدام السريع' : 'Pre-built templates for fast purchase and use'}</p>
 </div>
 </Link>
 <Link to="/client/submit-request">
 <div className="group rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-8 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
 <FileText className="h-10 w-10 text-primary mb-3" />
 <h3 className="text-lg font-black">{isRTL ? 'انشر طلبك وتلقَّ عروضاً متعددة ' : 'Post Request & Receive Multiple Bids '}</h3>
 <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'قارن عروض المكاتب واختر الأنسب' : 'Compare office bids and choose the best'}</p>
 </div>
 </Link>
 </div>

 {/* Stats */}
 <div className="grid gap-4 md:grid-cols-3 mb-8">
 {[
 { label: t('dashboard.active_projects'), value: activeCount, icon: Briefcase, color: 'text-success' },
 { label: isRTL ? 'عروض واردة' : 'Incoming Bids', value: totalBids, icon: Clock, color: 'text-warning' },
 { label: t('projects.my_requests'), value: requests.length, icon: FileText, color: 'text-gold' },
 ].map(stat => (
 <div key={stat.label} className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
 <div className="flex items-center justify-between">
 <stat.icon className={`h-8 w-8 ${stat.color}`} />
 <span className="text-3xl font-black">{stat.value}</span>
 </div>
 <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
 </div>
 ))}
 </div>

 {/* Quick actions */}
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
 {[
 { label: t('projects.submit_request'), to: '/client/submit-request', icon: Plus },
 { label: t('projects.my_requests'), to: '/client/my-requests', icon: FileText },
 { label: t('bids.compare'), to: '/client/bids', icon: Search },
 { label: t('templates.title'), to: '/client/templates', icon: Briefcase },
 ].map(action => (
 <Link key={action.to} to={action.to as '/'}>
 <div className="group flex items-center gap-3 rounded-xl border p-4 transition-all hover:border-gold/30 hover:shadow-md cursor-pointer">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gradient-gold group-hover:text-gold-foreground transition-all">
 <action.icon className="h-5 w-5" />
 </div>
 <span className="font-medium text-sm">{action.label}</span>
 </div>
 </Link>
 ))}
 </div>

 {/* Recent requests */}
 <div className="rounded-2xl border bg-card">
 <div className="p-6 border-b"><h2 className="text-lg font-bold">{t('projects.my_requests')}</h2></div>
 <div className="divide-y">
 {requests.length === 0 ? (
 <div className="p-12 text-center text-muted-foreground">{t('common.no_data')}</div>
 ) : (
 requests.slice(0, 5).map(req => (
 <div key={req.request_id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
 <div>
 <p className="font-medium">{req.title}</p>
 <p className="text-sm text-muted-foreground">{req.location} • {req.budget_range}</p>
 </div>
 <StatusBadge status={req.status || 'pending'} />
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 );
}
