import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { bidService } from '@/services/bidService';
import { projectRequestService } from '@/services/projectRequestService';
import { contractService } from '@/services/contractService';
import { notificationService } from '@/services/notificationService';
import { messagingService } from '@/services/messagingService';
import { templateService } from '@/services/templateService';
import { templatePurchaseService } from '@/services/templatePurchaseService';
import { serviceCatalogService } from '@/services/serviceCatalogService';
import { Send, FileText, Briefcase, Plus, ShoppingCart, Check, X, Wrench, Package, CheckCircle2, Inbox, Download, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/office/dashboard')({
 component: OfficeDashboard,
});

function OfficeDashboard() {
 const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const { user } = useAuth();
 const [bids, setBids] = useState<any[]>([]);
 const [requests, setRequests] = useState<any[]>([]);
 const [directBookings, setDirectBookings] = useState<any[]>([]);
 const [contracts, setContracts] = useState<any[]>([]);
 const [services, setServices] = useState<any[]>([]);
 const [templates, setTemplates] = useState<any[]>([]);
 const [templateOrders, setTemplateOrders] = useState<any[]>([]);

 useEffect(() => {
 if (!user?.id || !allowed) return;
 bidService.getByOffice(user.id).then(setBids).catch(() => {});
 projectRequestService.getApproved().then(setRequests).catch(() => {});
 projectRequestService.getAll().then(all => {
 setDirectBookings(all.filter((r: any) => r.status === 'direct_booking'));
 }).catch(() => {});
 contractService.getByUser(user.id).then(setContracts).catch(() => {});
 serviceCatalogService.getByOffice(user.id).then(setServices).catch(() => {});
 templateService.getByOffice(user.id).then(setTemplates).catch(() => {});
 templatePurchaseService.getByOffice(user.id).then(setTemplateOrders).catch(() => setTemplateOrders([]));
 }, [user?.id, allowed]);

 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  const acceptBooking = async (req: any) => {
    try {
      await projectRequestService.updateStatus(req.request_id, 'approved');
      if (req.client_id && user?.id) {
        await contractService.create({
          client_id: req.client_id,
          office_id: user.id,
          title: req.title,
          description: req.description || '',
        });
        await notificationService.send(req.client_id, isRTL ? 'تم قبول طلب الحجز وإنشاء العقد' : 'Your booking was accepted and contract generated');
        try {
          await messagingService.getOrCreateConversation({
            type: 'service_request',
            referenceId: req.request_id,
            referenceTitle: req.title || null,
            clientId: req.client_id,
            officeId: user.id,
          });
        } catch { /* non-blocking */ }
      }
      setDirectBookings(prev => prev.filter(r => r.request_id !== req.request_id));
      toast.success(isRTL ? 'تم قبول الطلب وفتح محادثة مع العميل' : 'Request accepted and conversation opened with client');
    } catch (err: any) { toast.error(err.message); }
  };

 const rejectBooking = async (req: any) => {
 try {
 await projectRequestService.updateStatus(req.request_id, 'rejected');
 setDirectBookings(prev => prev.filter(r => r.request_id !== req.request_id));
 toast.success('');
 } catch (err: any) { toast.error(err.message); }
 };

 const sentOffers = bids.filter(b => b.status === 'submitted');
 // Active = contracts not fully signed; Completed = both signed
 const activeProjects = contracts.filter((c: any) => !(c.is_client_signed && c.is_office_signed));
 const completedProjects = contracts.filter((c: any) => c.is_client_signed && c.is_office_signed);

 const sar = isRTL ? 'ر.س' : 'SAR';

 const sectionCard = (
 title: string,
 icon: any,
 children: React.ReactNode,
 headerExtra?: React.ReactNode,
 ) => {
 const Icon = icon;
 return (
 <div className="rounded-2xl border bg-card mb-6">
 <div className="p-5 border-b flex items-center justify-between">
 <h2 className="text-base font-bold flex items-center gap-2">
 <Icon className="h-4 w-4 text-gold" />{title}
 </h2>
 {headerExtra}
 </div>
 <div className="divide-y">{children}</div>
 </div>
 );
 };

 const empty = (label: string) => (
 <div className="p-8 text-center text-sm text-muted-foreground">{label}</div>
 );

 return (
 <div className="mx-auto max-w-7xl px-4 py-8">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h1 className="text-3xl font-black">{t('dashboard.welcome')}، {user?.name}</h1>
 <p className="text-muted-foreground mt-1">{t('dashboard.overview')}</p>
 </div>
 </div>

 {/* Stats */}
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
 {[
 { label: isRTL ? 'طلبات واردة' : 'Incoming Requests', value: requests.length + directBookings.length, icon: Inbox, color: 'text-gold' },
 { label: isRTL ? 'عروض مرسلة' : 'Sent Offers', value: sentOffers.length, icon: Send, color: 'text-warning' },
 { label: isRTL ? 'مشاريع نشطة' : 'Active Projects', value: activeProjects.length, icon: Briefcase, color: 'text-primary' },
 { label: isRTL ? 'طلبات قوالب' : 'Template Orders', value: templateOrders.length, icon: ShoppingCart, color: 'text-emerald-500' },
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
  <div className="grid gap-4 md:grid-cols-4 mb-8">
 {[
 { label: t('projects.browse_requests'), to: '/office/browse-requests', icon: FileText },
 { label: isRTL ? 'مشاريع حولي' : 'Projects Near Me', to: '/office/nearby', icon: MapPin },
 { label: isRTL ? 'إدارة خدمات المكتب' : 'Manage Office Services', to: '/office/catalog', icon: Plus },
 { label: isRTL ? 'القوالب الجاهزة' : 'Ready Templates', to: '/office/upload-template', icon: Briefcase },
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

 {/* Direct Booking Requests (incoming service requests) */}
 {sectionCard(
 isRTL ? 'طلبات الحجز المباشر' : 'Incoming Service Requests',
 ShoppingCart,
 directBookings.length === 0 ? empty(t('common.no_data')) :
 directBookings.map(req => (
 <div key={req.request_id} className="flex items-center justify-between p-4">
 <div>
 <p className="font-medium">{req.title}</p>
 <p className="text-sm text-muted-foreground">{req.location} • {req.budget_range}</p>
 </div>
 <div className="flex gap-2">
 <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => acceptBooking(req)}>
 <Check className="h-3 w-3 me-1" />{isRTL ? 'قبول' : 'Accept'}
 </Button>
 <Button size="sm" variant="destructive" onClick={() => rejectBooking(req)}>
 <X className="h-3 w-3 me-1" />{isRTL ? 'رفض' : 'Reject'}
 </Button>
 </div>
 </div>
 )),
 <Badge variant="secondary">{directBookings.length}</Badge>,
 )}

 {/* Sent Offers */}
 {sectionCard(
 isRTL ? 'العروض المرسلة' : 'Sent Offers',
 Send,
 sentOffers.length === 0 ? empty(t('common.no_data')) :
 sentOffers.slice(0, 5).map(bid => (
 <div key={bid.bid_id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
 <div>
 <p className="font-medium">{bid.price?.toLocaleString()} {sar}</p>
 <p className="text-sm text-muted-foreground">{bid.timeline} {t('common.days')}</p>
 </div>
 <StatusBadge status={bid.status || 'submitted'} />
 </div>
 )),
 <Badge variant="secondary">{sentOffers.length}</Badge>,
 )}

 {/* Active Projects */}
 {sectionCard(
 isRTL ? 'المشاريع النشطة' : 'Active Projects',
 Briefcase,
 activeProjects.length === 0 ? empty(t('common.no_data')) :
 activeProjects.slice(0, 5).map((c: any) => (
 <div key={c.contract_id} className="flex items-center justify-between p-4">
 <div className="min-w-0">
 <p className="font-medium truncate">{c.title}</p>
 <p className="text-xs text-muted-foreground">
 {c.is_client_signed ? (isRTL ? 'موقّع من العميل' : 'Client signed') : (isRTL ? 'بانتظار توقيع العميل' : 'Awaiting client signature')}
 </p>
 </div>
 <Link to="/office/contract-sign" search={{ contract_id: c.contract_id } as any}>
 <Button size="sm" variant="outline">{isRTL ? 'فتح' : 'Open'}</Button>
 </Link>
 </div>
 )),
 <Badge variant="secondary">{activeProjects.length}</Badge>,
 )}

 {/* Completed Projects */}
 {sectionCard(
 isRTL ? 'المشاريع المنجزة' : 'Completed Projects',
 CheckCircle2,
 completedProjects.length === 0 ? empty(t('common.no_data')) :
 completedProjects.slice(0, 5).map((c: any) => (
 <div key={c.contract_id} className="flex items-center justify-between p-4">
 <div className="min-w-0">
 <p className="font-medium truncate">{c.title}</p>
 <p className="text-xs text-muted-foreground">{c.signed_at ? new Date(c.signed_at).toLocaleDateString() : ''}</p>
 </div>
 <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20" variant="outline">
 {isRTL ? 'مكتمل' : 'Completed'}
 </Badge>
 </div>
 )),
 <Badge variant="secondary">{completedProjects.length}</Badge>,
 )}

 {/* Template Orders */}
 {sectionCard(
 isRTL ? 'طلبات القوالب' : 'Template Orders',
 ShoppingCart,
 templateOrders.length === 0 ? empty(isRTL ? 'لا توجد مشتريات بعد' : 'No template orders yet') :
 templateOrders.slice(0, 8).map((p: any) => (
 <div key={p.id} className="flex items-center justify-between p-4">
 <div className="min-w-0">
 <p className="font-medium truncate">{p.title_snapshot}</p>
 <p className="text-xs text-muted-foreground">
 {Number(p.purchase_price ?? 0).toLocaleString()} {sar} • {p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant="outline" className="text-[10px]">
 {p.status === 'delivered' ? (isRTL ? 'تم التسليم' : 'Delivered') : (isRTL ? 'مدفوع' : 'Paid')}
 </Badge>
 {p.file_url_snapshot && (
 <a href={p.file_url_snapshot} target="_blank" rel="noopener noreferrer">
 <Button size="sm" variant="outline"><Download className="h-3 w-3 me-1" />{isRTL ? 'الملف' : 'File'}</Button>
 </a>
 )}
 </div>
 </div>
 )),
 <Badge variant="secondary">{templateOrders.length}</Badge>,
 )}

 {/* My Services */}
 {sectionCard(
 isRTL ? 'خدماتي' : 'My Services',
 Wrench,
 services.length === 0 ? empty(t('common.no_data')) :
 services.slice(0, 5).map((s: any) => (
 <div key={s.catalog_id} className="flex items-center justify-between p-4">
 <div>
 <p className="font-medium">{s.category}</p>
 <p className="text-xs text-muted-foreground">{s.sub_category} • {s.pricing_model}</p>
 </div>
 <span className="text-sm font-bold text-gold">{s.price?.toLocaleString?.() ?? '—'} {sar}</span>
 </div>
 )),
 <Link to="/office/catalog"><Button size="sm" variant="ghost">{isRTL ? 'إدارة' : 'Manage'}</Button></Link>,
 )}

 {/* My Templates */}
 {sectionCard(
 isRTL ? 'قوالبي' : 'My Templates',
 Package,
 templates.length === 0 ? empty(t('common.no_data')) :
 templates.slice(0, 5).map((tpl: any) => (
 <div key={tpl.template_id} className="flex items-center justify-between p-4">
 <div className="min-w-0">
 <p className="font-medium truncate">{tpl.title}</p>
 <p className="text-xs text-muted-foreground">{tpl.category} {tpl.sub_category ? `• ${tpl.sub_category}` : ''}</p>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant={tpl.is_approved ? 'default' : 'secondary'} className="text-[10px]">
 {tpl.is_approved ? (isRTL ? 'معتمد' : 'Approved') : (isRTL ? 'بانتظار المراجعة' : 'Pending')}
 </Badge>
 <span className="text-sm font-bold text-gold">{tpl.price?.toLocaleString?.() ?? '—'} {sar}</span>
 </div>
 </div>
 )),
 <Link to="/office/upload-template"><Button size="sm" variant="ghost">{isRTL ? 'إضافة' : 'Add'}</Button></Link>,
 )}
 </div>
 );
}
