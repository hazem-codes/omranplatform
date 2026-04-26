import { Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Menu, X, Bell, LogOut, Calculator, ChevronDown, Building2, Ruler, Zap, Shield, Paintbrush, MapPin, FileCheck, ClipboardList, Wrench, FileText, LayoutDashboard, FolderOpen, UserCircle, Upload, MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { notificationService } from '@/services/notificationService';
import { messagingService } from '@/services/messagingService';
import omranLogo from '@/assets/omran-logo.png';

const SERVICE_CATEGORIES_NAV = [
 { key: '1', ar: 'التصميم المعماري', en: 'Architectural Design', icon: Building2 },
 { key: '2', ar: 'الهندسة الإنشائية', en: 'Structural Engineering', icon: Ruler },
 { key: '3', ar: 'الهندسة الكهروميكانيكية', en: 'MEP Engineering', icon: Zap },
 { key: '4', ar: 'التصاريح والاستشارات', en: 'Permits & Consulting', icon: FileCheck },
 { key: '5', ar: 'الإشراف على البناء', en: 'Construction Supervision', icon: Shield },
 { key: '6', ar: 'البناء الكامل', en: 'Full Construction', icon: Building2 },
 { key: '7', ar: 'أعمال التشطيب', en: 'Finishing Works', icon: Paintbrush },
 { key: '8', ar: 'المساحة والجيوماتكس', en: 'Surveying & Geomatics', icon: MapPin },
];

export function Navbar() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const { user, isAuthenticated, logout, role } = useAuth();
 const [mobileOpen, setMobileOpen] = useState(false);
 const [megaOpen, setMegaOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const megaRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      notificationService.getUnreadCount(user.id).then(setUnreadCount).catch(() => {});
      messagingService
        .getConversationsByUser(user.id)
        .then(async (convs) => {
          const ids = (convs ?? []).map((c: any) => c.id).filter(Boolean);
          if (ids.length === 0) {
            setUnreadMessages(0);
            return;
          }
          const counts = await messagingService.getUnreadCountsForUser(user.id, ids);
          let total = 0;
          counts.forEach((n) => (total += n));
          setUnreadMessages(total);
        })
        .catch(() => {});
    }
  }, [user?.id]);

 useEffect(() => {
 function handleClickOutside(e: MouseEvent) {
 if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
 setMegaOpen(false);
 }
 }
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const homePath = role === 'client' ? '/client/home'
 : role === 'engineering_office' ? '/office/home'
 : role === 'supervisor' ? '/supervisor/dashboard'
 : '/';

 const handleLogout = async () => {
 await logout();
 navigate({ to: '/' as '/' });
 };

 // ─── PUBLIC (GUEST) MEGA DROPDOWN ───
 const renderPublicMega = () => (
 <div className="absolute end-0 top-full mt-2 w-[400px] rounded-2xl border bg-card p-6 shadow-2xl z-50">
 <div className="grid grid-cols-2 gap-6">
 <div>
 <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
 {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
 </h4>
 <div className="space-y-1">
 <Link to="/estimator" onClick={() => setMegaOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
 <Calculator className="h-4 w-4 text-gold" />
 <span>{isRTL ? ' احسب تكلفة مشروعك' : ' Cost calculator'}</span>
 </Link>
 <Link to="/register" onClick={() => setMegaOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
 <ClipboardList className="h-4 w-4 text-gold" />
 <span>{isRTL ? ' سجّل وابدأ مشروعك' : ' Register & start'}</span>
 </Link>
 </div>
 </div>
 <div>
 <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
 {isRTL ? 'الخدمات المتوفرة' : 'Available Services'}
 </h4>
 <div className="space-y-1">
 {SERVICE_CATEGORIES_NAV.slice(0, 4).map(cat => (
 <div key={cat.key} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
 <cat.icon className="h-4 w-4 text-gold" />
 <span>{isRTL ? cat.ar : cat.en}</span>
 </div>
 ))}
 <Link to="/register" onClick={() => setMegaOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gold transition-colors hover:bg-muted">
 <span>{isRTL ? 'سجّل لعرض الكل →' : 'Register to see all →'}</span>
 </Link>
 </div>
 </div>
 </div>
 </div>
 );

 // ─── CLIENT MEGA DROPDOWN ───
 const renderClientMega = () => (
 <div className="absolute end-0 top-full mt-2 w-[480px] rounded-2xl border bg-card p-6 shadow-2xl z-50">
 <div className="grid grid-cols-2 gap-6">
 <div>
 <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
 {isRTL ? 'تصفح الخدمات' : 'Browse Services'}
 </h4>
 <div className="space-y-1">
 {SERVICE_CATEGORIES_NAV.map(cat => (
 <Link key={cat.key} to="/client/catalog" search={{ category: cat.key }}
 onClick={() => setMegaOpen(false)}
 className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
 <cat.icon className="h-4 w-4 text-gold" />
 <span>{isRTL ? cat.ar : cat.en}</span>
 </Link>
 ))}
 </div>
 </div>
 <div>
 <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
 {isRTL ? 'ابدأ مشروعك' : 'Start Your Project'}
 </h4>
 <div className="space-y-1">
 <Link to="/client/submit-request" onClick={() => setMegaOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
 <ClipboardList className="h-4 w-4 text-gold" />
 <span>{isRTL ? ' انشر طلبك وتلقَّ عروضاً' : ' Post & receive bids'}</span>
 </Link>
 <Link to="/client/catalog" onClick={() => setMegaOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
 <Wrench className="h-4 w-4 text-gold" />
 <span>{isRTL ? ' احجز خدمة هندسية' : ' Book engineering services'}</span>
 </Link>
 <Link to="/client/templates" onClick={() => setMegaOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
 <FileText className="h-4 w-4 text-gold" />
 <span>{isRTL ? ' تصفح القوالب الجاهزة' : ' Browse ready-made templates'}</span>
 </Link>
 <Link to="/estimator" onClick={() => setMegaOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted">
 <Calculator className="h-4 w-4 text-gold" />
 <span>{isRTL ? ' احسب تكلفة مشروعك' : ' Cost calculator'}</span>
 </Link>
 </div>
 </div>
 </div>
 </div>
 );

 // ─── OFFICE NAV LINKS ───
 const renderOfficeNav = () => (
 <>
 <Link to="/office/home" onClick={() => setMegaOpen(false)}>
 <Button variant="ghost" size="sm"><LayoutDashboard className="h-4 w-4 me-1" />{isRTL ? 'لوحة المكتب' : 'Office Home'}</Button>
 </Link>
 <Link to="/office/catalog" onClick={() => setMegaOpen(false)}>
 <Button variant="ghost" size="sm"><Wrench className="h-4 w-4 me-1" />{isRTL ? 'خدمات المكتب' : 'Office Services'}</Button>
 </Link>
 <Link to="/office/upload-template" onClick={() => setMegaOpen(false)}>
 <Button variant="ghost" size="sm"><Upload className="h-4 w-4 me-1" />{isRTL ? 'القوالب الجاهزة' : 'Ready Templates'}</Button>
 </Link>
 <Link to="/office/nearby" onClick={() => setMegaOpen(false)}>
 <Button variant="ghost" size="sm"><MapPin className="h-4 w-4 me-1" />{isRTL ? 'مشاريع حولي' : 'Projects Near Me'}</Button>
 </Link>
 <Link to="/office/browse-requests" onClick={() => setMegaOpen(false)}>
 <Button variant="ghost" size="sm"><FolderOpen className="h-4 w-4 me-1" />{isRTL ? 'الطلبات المتاحة' : 'Requests'}</Button>
 </Link>
 <Link to="/office/messages" onClick={() => setMegaOpen(false)}>
 <Button variant="ghost" size="sm"><MessageSquare className="h-4 w-4 me-1" />{isRTL ? 'الرسائل' : 'Messages'}</Button>
 </Link>
 <Link to="/office/profile" onClick={() => setMegaOpen(false)}>
 <Button variant="ghost" size="sm"><UserCircle className="h-4 w-4 me-1" />{isRTL ? 'ملف المكتب' : 'Profile'}</Button>
 </Link>
 </>
 );

 // ─── SUPERVISOR NAV LINKS ───
 const renderSupervisorNav = () => (
 <>
 <Link to="/supervisor/dashboard">
 <Button variant="ghost" size="sm"><LayoutDashboard className="h-4 w-4 me-1" />{isRTL ? 'لوحة التحكم' : 'Dashboard'}</Button>
 </Link>
 <Link to="/supervisor/accounts">
 <Button variant="ghost" size="sm">{isRTL ? 'الحسابات' : 'Accounts'}</Button>
 </Link>
 <Link to="/supervisor/disputes">
 <Button variant="ghost" size="sm">{isRTL ? 'النزاعات' : 'Disputes'}</Button>
 </Link>
 </>
 );

 return (
 <nav className="omran-navbar-enter sticky top-0 z-40 border-b bg-card/80 backdrop-blur-xl">
 <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
  <Link to={homePath as '/'} className="flex items-center">
   <img
   src={omranLogo}
   alt="Omran"
   className="omran-brand-logo h-[72px] w-[72px] object-contain"
   />
  </Link>

 <div className="hidden items-center gap-1 md:flex">
 {/* ── PUBLIC / CLIENT: show services mega ── */}
 {(!isAuthenticated || role === 'client') && (
 <>
 {!isAuthenticated && (
 <Link to="/"><Button variant="ghost" size="sm">{t('nav.home')}</Button></Link>
 )}
 {role === 'client' && (
 <Link to="/client/home"><Button variant="ghost" size="sm">{t('nav.home')}</Button></Link>
 )}
 <div className="relative" ref={megaRef}>
 <Button variant="ghost" size="sm" onClick={() => setMegaOpen(!megaOpen)} className="gap-1">
 {isRTL ? 'الخدمات والقوالب' : 'Services & Templates'}
 <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaOpen ? 'rotate-180' : ''}`} />
 </Button>
 {megaOpen && (role === 'client' ? renderClientMega() : renderPublicMega())}
 </div>
 <Link to="/estimator"><Button variant="ghost" size="sm"><Calculator className="h-4 w-4 me-1" />{isRTL ? 'حاسبة التكاليف' : 'Estimator'}</Button></Link>
 {role === 'client' && (
 <Link to="/client/dashboard"><Button variant="ghost" size="sm">{isRTL ? 'لوحة التحكم' : 'Dashboard'}</Button></Link>
 )}
 </>
 )}

 {/* ── OFFICE ── */}
 {role === 'engineering_office' && renderOfficeNav()}

 {/* ── SUPERVISOR ── */}
 {role === 'supervisor' && renderSupervisorNav()}
 </div>

 <div className="flex items-center gap-1">
 <LanguageToggle />
 <ThemeToggle />
 {isAuthenticated ? (
 <>
 <Link to="/notifications" className="relative">
 <Button variant="ghost" size="icon">
 <Bell className="h-5 w-5" />
 {unreadCount > 0 && (
 <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">{unreadCount}</span>
 )}
 </Button>
 </Link>
 <div className="hidden items-center gap-2 md:flex">
 <span className="text-sm text-muted-foreground">{user?.name}</span>
 <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
 </div>
 </>
 ) : (
 <div className="hidden gap-2 md:flex">
 <Link to="/login"><Button variant="ghost" size="sm">{t('nav.login')}</Button></Link>
 <Link to="/register"><Button size="sm" className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">{t('nav.register')}</Button></Link>
 </div>
 )}
 <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
 {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
 </Button>
 </div>
 </div>

 {/* ── MOBILE MENU ── */}
 {mobileOpen && (
 <div className="border-t bg-card p-4 md:hidden">
 <div className="flex flex-col gap-2">
 {!isAuthenticated && (
 <>
 <Link to="/" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{t('nav.home')}</Button></Link>
 <Link to="/estimator" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start"><Calculator className="h-4 w-4 me-2" />{isRTL ? 'حاسبة التكاليف' : 'Estimator'}</Button></Link>
 <Link to="/login" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{t('nav.login')}</Button></Link>
 <Link to="/register" onClick={() => setMobileOpen(false)}><Button className="w-full bg-gradient-gold text-gold-foreground">{t('nav.register')}</Button></Link>
 </>
 )}
 {role === 'client' && (
 <>
 <Link to="/client/home" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{t('nav.home')}</Button></Link>
 <Link to="/client/catalog" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'تصفح الخدمات' : 'Browse Services'}</Button></Link>
 <Link to="/client/templates" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'القوالب الجاهزة' : 'Ready-made Templates'}</Button></Link>
 <Link to="/client/submit-request" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'انشر طلبك' : 'Post Request'}</Button></Link>
 <Link to="/estimator" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'حاسبة التكاليف' : 'Estimator'}</Button></Link>
 <Link to="/client/dashboard" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'لوحة التحكم' : 'Dashboard'}</Button></Link>
 </>
 )}
 {role === 'engineering_office' && (
 <>
 <Link to="/office/home" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'الرئيسية' : 'Home'}</Button></Link>
 <Link to="/office/catalog" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'إدارة الكتالوج' : 'Catalog'}</Button></Link>
 <Link to="/office/upload-template" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'القوالب الجاهزة' : 'Ready Templates'}</Button></Link>
  <Link to="/office/nearby" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'مشاريع حولي' : 'Projects Near Me'}</Button></Link>
 <Link to="/office/browse-requests" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'الطلبات المتاحة' : 'Requests'}</Button></Link>
 <Link to="/office/messages" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'الرسائل' : 'Messages'}</Button></Link>
 <Link to="/office/profile" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'ملف المكتب' : 'Profile'}</Button></Link>
 </>
 )}
 {role === 'supervisor' && (
 <>
 <Link to="/supervisor/dashboard" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'لوحة التحكم' : 'Dashboard'}</Button></Link>
 <Link to="/supervisor/accounts" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'الحسابات' : 'Accounts'}</Button></Link>
 <Link to="/supervisor/disputes" onClick={() => setMobileOpen(false)}><Button variant="ghost" className="w-full justify-start">{isRTL ? 'النزاعات' : 'Disputes'}</Button></Link>
 </>
 )}
 {isAuthenticated && (
 <Button variant="ghost" className="w-full justify-start" onClick={() => { handleLogout(); setMobileOpen(false); }}>
 <LogOut className="h-4 w-4 me-2" />{t('nav.logout')}
 </Button>
 )}
 </div>
 </div>
 )}
 </nav>
 );
}
