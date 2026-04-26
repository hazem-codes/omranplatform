import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { bidService } from '@/services/bidService';
import { notificationService } from '@/services/notificationService';
import { Wrench, FolderOpen, Upload, UserCircle, Send, Bell, Briefcase, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/office/home')({
 component: OfficeHome,
});

function OfficeHome() {
 const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');
 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const Arrow = isRTL ? ArrowLeft : ArrowRight;
 const { user } = useAuth();
 const [bids, setBids] = useState<any[]>([]);
 const [unread, setUnread] = useState(0);

 useEffect(() => {
 if (user?.id) {
 bidService.getByOffice(user.id).then(setBids).catch(() => {});
 notificationService.getUnreadCount(user.id).then(setUnread).catch(() => {});
 }
 }, [user?.id]);

 const sentBids = bids.length;
 const acceptedBids = bids.filter(b => b.status === 'accepted').length;

 const shortcuts = [
 { icon: Wrench, title: isRTL ? 'إدارة خدمات المكتب' : 'Manage Office Services', desc: isRTL ? 'أضف وعدّل الخدمات المخصصة لمشاريع العملاء' : 'Add and edit custom services for client projects', to: '/office/catalog', color: 'bg-gold/10 text-gold' },
 { icon: FolderOpen, title: isRTL ? 'تصفح الطلبات المتاحة' : 'Browse Requests', desc: isRTL ? 'مشاريع جديدة مناسبة لتخصصك' : 'New projects matching your specialty', to: '/office/browse-requests', color: 'bg-blue-500/10 text-blue-600' },
 { icon: Upload, title: isRTL ? 'إدارة القوالب الجاهزة' : 'Manage Ready Templates', desc: isRTL ? 'أضف قوالب هندسية جاهزة للبيع بشكل منفصل عن الخدمات' : 'Publish ready engineering templates separately from services', to: '/office/upload-template', color: 'bg-purple-500/10 text-purple-600' },
 { icon: UserCircle, title: isRTL ? 'ملف المكتب' : 'Office Profile', desc: isRTL ? 'عدّل بيانات مكتبك ومعرض أعمالك' : 'Edit your profile and portfolio', to: '/office/profile', color: 'bg-emerald-500/10 text-emerald-600' },
 ];

 return (
 <div className="mx-auto max-w-7xl px-4 py-8">
 {/* Welcome */}
 <div className="mb-8 rounded-2xl bg-gradient-navy p-8 text-white shadow-navy">
 <h1 className="text-2xl font-black md:text-3xl">
 {isRTL ? `أهلاً ${user?.name || ''}` : `Welcome ${user?.name || ''}`} 
 </h1>
 <p className="mt-2 text-white/70">
 {isRTL ? 'أدر مكتبك الهندسي واستقبل المشاريع' : 'Manage your office and receive projects'}
 </p>
 </div>

 {/* Quick Stats */}
 <div className="mb-8 grid grid-cols-3 gap-4">
 <div className="rounded-xl border bg-card p-5 text-center">
 <Send className="mx-auto h-6 w-6 text-gold" />
 <div className="mt-2 text-2xl font-black">{sentBids}</div>
 <div className="text-xs text-muted-foreground">{isRTL ? 'عروض مرسلة' : 'Sent Bids'}</div>
 </div>
 <div className="rounded-xl border bg-card p-5 text-center">
 <Briefcase className="mx-auto h-6 w-6 text-emerald-500" />
 <div className="mt-2 text-2xl font-black">{acceptedBids}</div>
 <div className="text-xs text-muted-foreground">{isRTL ? 'مشاريع نشطة' : 'Active Projects'}</div>
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
 <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
 <s.icon className="h-6 w-6" />
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

 {/* Recent Bids */}
 {bids.length > 0 && (
 <div className="mt-10">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-bold">{isRTL ? 'آخر العروض المرسلة' : 'Recent Bids'}</h2>
 <Link to="/office/dashboard"><Button variant="ghost" size="sm">{isRTL ? 'عرض الكل' : 'View All'}</Button></Link>
 </div>
 <div className="space-y-3">
 {bids.slice(0, 3).map((bid: any) => (
 <div key={bid.bid_id} className="flex items-center justify-between rounded-xl border bg-card p-4">
 <div>
 <h4 className="font-medium">{isRTL ? 'عرض سعر' : 'Bid'} - {bid.price?.toLocaleString()} {isRTL ? 'ريال' : 'SAR'}</h4>
 <p className="text-xs text-muted-foreground">{bid.timeline} {isRTL ? 'يوم' : 'days'} • {new Date(bid.submitted_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
 </div>
 <span className={`rounded-full px-3 py-1 text-xs font-medium ${bid.status === 'accepted' ? 'bg-primary/12 text-primary' : bid.status === 'submitted' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
 {bid.status}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
