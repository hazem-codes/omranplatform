import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { projectRequestService } from '@/services/projectRequestService';
import { notificationService } from '@/services/notificationService';
import { Calculator, ClipboardList, ShoppingCart, FileText, Briefcase, Bell, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/home')({
 component: ClientHome,
});

function ClientHome() {
 const { allowed, isLoading: guardLoading } = useAuthGuard('client');
 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const Arrow = isRTL ? ArrowLeft : ArrowRight;
 const { user } = useAuth();
 const [requests, setRequests] = useState<any[]>([]);
 const [unread, setUnread] = useState(0);

 useEffect(() => {
 if (user?.id) {
 projectRequestService.getByClient(user.id).then(setRequests).catch(() => {});
 notificationService.getUnreadCount(user.id).then(setUnread).catch(() => {});
 }
 }, [user?.id]);

 const activeCount = requests.filter(r => r.status === 'approved' || r.status === 'active').length;
 const pendingCount = requests.filter(r => r.status === 'pending').length;

 const shortcuts = [
 { icon: Calculator, title: isRTL ? 'احسب تكلفة مشروعك' : 'Estimate Cost', desc: isRTL ? 'تقدير فوري لتكلفة البناء والتصميم' : 'Instant construction cost estimate', to: '/estimator', color: 'bg-emerald-500/10 text-emerald-600', badge: isRTL ? 'أداة' : 'Tool', badgeColor: 'bg-emerald-500/15 text-emerald-700' },
 { icon: ClipboardList, title: isRTL ? 'انشر مشروعاً وتلقَّ عروضاً' : 'Publish Project', desc: isRTL ? 'وزّع مشروعك على عدة مكاتب لتنافس بالأسعار والعروض' : 'Broadcast to multiple offices and compare their bids', to: '/client/submit-request', color: 'bg-blue-500/10 text-blue-600', badge: isRTL ? 'عدة مكاتب' : 'Multiple offices', badgeColor: 'bg-blue-500/15 text-blue-700' },
 { icon: ShoppingCart, title: isRTL ? 'اطلب خدمة من مكتب محدد' : 'Request a Service', desc: isRTL ? 'اختر مكتباً وأرسل له طلب خدمة مباشرة' : 'Pick one office and send a direct service request', to: '/client/catalog', color: 'bg-gold/10 text-gold', badge: isRTL ? 'مكتب واحد' : 'Single office', badgeColor: 'bg-gold/20 text-gold' },
 { icon: FileText, title: isRTL ? 'اشترِ قالباً جاهزاً' : 'Buy a Template', desc: isRTL ? 'منتج رقمي جاهز للتنزيل والاستخدام فوراً' : 'Instant digital product, download and use right away', to: '/client/templates', color: 'bg-purple-500/10 text-purple-600', badge: isRTL ? 'شراء فوري' : 'Instant buy', badgeColor: 'bg-purple-500/15 text-purple-700' },
 ];

 return (
 <div className="mx-auto max-w-7xl px-4 py-8">
 {/* Welcome */}
 <div className="mb-8 rounded-2xl bg-gradient-gold p-8 text-gold-foreground shadow-gold">
 <h1 className="text-2xl font-black md:text-3xl">
 {isRTL ? `أهلاً ${user?.name || ''}` : `Welcome ${user?.name || ''}`} 
 </h1>
 <p className="mt-2 text-gold-foreground/80">
 {isRTL ? 'ابدأ مشروعك الهندسي من هنا' : 'Start your engineering project from here'}
 </p>
 </div>

 {/* Quick Stats */}
 <div className="mb-8 grid grid-cols-3 gap-4">
 <div className="rounded-xl border bg-card p-5 text-center">
 <Briefcase className="mx-auto h-6 w-6 text-gold" />
 <div className="mt-2 text-2xl font-black">{activeCount}</div>
 <div className="text-xs text-muted-foreground">{isRTL ? 'مشاريع نشطة' : 'Active Projects'}</div>
 </div>
 <div className="rounded-xl border bg-card p-5 text-center">
 <Clock className="mx-auto h-6 w-6 text-blue-500" />
 <div className="mt-2 text-2xl font-black">{pendingCount}</div>
 <div className="text-xs text-muted-foreground">{isRTL ? 'عروض بانتظار الرد' : 'Pending Bids'}</div>
 </div>
 <div className="rounded-xl border bg-card p-5 text-center">
 <Bell className="mx-auto h-6 w-6 text-red-500" />
 <div className="mt-2 text-2xl font-black">{unread}</div>
 <div className="text-xs text-muted-foreground">{isRTL ? 'إشعارات جديدة' : 'New Notifications'}</div>
 </div>
 </div>

 {/* Shortcut Cards */}
 <h2 className="mb-4 text-lg font-bold">{isRTL ? 'ابدأ من هنا' : 'Quick Actions'}</h2>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {shortcuts.map((s, i) => (
 <Link key={i} to={s.to as '/'}>
 <div className="group h-full rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:-translate-y-1">
 <div className="mb-4 flex items-center justify-between">
 <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
 <s.icon className="h-6 w-6" />
 </div>
 <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.badgeColor}`}>{s.badge}</span>
 </div>
 <h3 className="font-bold">{s.title}</h3>
 <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
 <div className="mt-3 flex items-center gap-1 text-sm font-medium text-gold">
 {isRTL ? 'ابدأ' : 'Start'} <Arrow className="h-4 w-4" />
 </div>
 </div>
 </Link>
 ))}
 </div>

 {/* Recent Activity */}
 {requests.length > 0 && (
 <div className="mt-10">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold">{isRTL ? 'آخر الطلبات' : 'Recent Requests'}</h2>
 <Link to="/client/dashboard"><Button variant="ghost" size="sm">{isRTL ? 'عرض الكل' : 'View All'}</Button></Link>
 </div>
 <div className="space-y-3">
 {requests.slice(0, 3).map((req: any) => (
 <div key={req.request_id} className="flex items-center justify-between rounded-xl border bg-card p-4">
 <div>
 <h4 className="font-medium">{req.title}</h4>
 <p className="text-xs text-muted-foreground">{req.location} • {new Date(req.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
 </div>
 <span className={`rounded-full px-3 py-1 text-xs font-medium ${req.status === 'approved' ? 'bg-primary/12 text-primary' : req.status === 'pending' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
 {req.status}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
