import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { Building2, Ruler, Zap, Shield, Paintbrush, MapPin, ArrowLeft, ArrowRight, Calculator, Star, Bot, CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEED_OFFICES } from '@/data/seedData';
import { supabase } from '@/integrations/supabase/client';
import { resolvePostAuthDestination } from '@/services/authRoutingService';
import riyadhHero from '@/assets/riyadh-hero.jpg';

export const Route = createFileRoute('/')({
 component: LandingPage,
 head: () => ({
 meta: [
 { title: 'عمران — خدمات هندسية احترافية في السعودية' },
 { name: 'description', content: 'عمران تربط أصحاب المشاريع بالمكاتب الهندسية المعتمدة في المملكة العربية السعودية.' },
 ],
 }),
});

const featuredOffices = [
 { ...SEED_OFFICES[0], topServices: ['تصميم معماري', 'هندسة إنشائية', 'تصاريح'], highlight: 'تصميم فيلا من 15,000 ريال' },
 { ...SEED_OFFICES[2], topServices: ['تصميم معماري', 'كهروميكانيك', 'تشطيب'], highlight: 'تشطيب فاخر من 500 ريال/م²' },
 { ...SEED_OFFICES[1], topServices: ['هندسة إنشائية', 'إشراف', 'بناء كامل'], highlight: 'بناء كامل من 800 ريال/م²' },
];

function LandingPage() {
 const { i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const Arrow = isRTL ? ArrowLeft : ArrowRight;
 const { isAuthenticated, role, isLoading } = useAuth();
 const navigate = useNavigate();
 const [scrollOffset, setScrollOffset] = useState(0);
 const section3Ref = useRef(null);
 const section4Ref = useRef(null);
 const section5Ref = useRef(null);
 const section6Ref = useRef(null);

 // Redirect logged-in users to their home
 useEffect(() => {
 if (isLoading || !isAuthenticated) return;
 let cancelled = false;

 (async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user || cancelled) return;
 const dest = await resolvePostAuthDestination(user.id);
 if (cancelled) return;
 navigate({ to: dest as '/' });
 })();

 return () => {
 cancelled = true;
 };
 }, [isAuthenticated, role, isLoading, navigate]);

 // Scroll animation for hero button section
 useEffect(() => {
 const handleScroll = () => {
 const offset = Math.min(window.scrollY * 0.15, 40);
 setScrollOffset(offset);
 };
 window.addEventListener('scroll', handleScroll);
 return () => window.removeEventListener('scroll', handleScroll);
 }, []);

 // IntersectionObserver for reveal animations
 useEffect(() => {
 const observer = new IntersectionObserver(
 (entries) => {
 entries.forEach((entry) => {
 if (entry.isIntersecting) {
 entry.target.classList.add('animate-reveal');
 const cards = entry.target.querySelectorAll('[data-reveal-card]');
 cards.forEach((card, index) => {
 (card as HTMLElement).style.animation = `revealCard 0.6s ease-out ${index * 0.1}s both`;
 });
 observer.unobserve(entry.target);
 }
 });
 },
 { threshold: 0.1 }
 );

 [section3Ref, section4Ref, section5Ref, section6Ref].forEach((ref) => {
 if (ref.current) observer.observe(ref.current);
 });

 return () => observer.disconnect();
 }, []);

 // Don't render landing for authenticated users
 if (isAuthenticated && role) return null;

 return (
 <div>
 <style>{`
 @keyframes revealSection {
 from {
 opacity: 0;
 transform: translateY(40px);
 }
 to {
 opacity: 1;
 transform: translateY(0);
 }
 }
 @keyframes revealCard {
 from {
 opacity: 0;
 transform: translateY(40px);
 }
 to {
 opacity: 1;
 transform: translateY(0);
 }
 }
 .animate-reveal {
 animation: revealSection 0.6s ease-out forwards;
 }
 `}</style>
 {/* SECTION 1 — Hero */}
 <section className="relative overflow-hidden py-24 lg:py-36">
 <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${riyadhHero})` }} />
 <div className="absolute inset-0 bg-black/60" />
 <div className="relative mx-auto max-w-7xl px-4 text-center">
 <h1 className="omran-hero-item text-4xl font-black tracking-tight text-white md:text-6xl lg:text-7xl" style={{ animationDelay: '0s' }}>
 {isRTL ? 'عَمّر بيتك مع عمران' : 'BUILD YOUR HOME WITH OMRAN'}
 </h1>
 <p className="omran-hero-item mx-auto mt-4 max-w-2xl text-2xl font-light text-white/85 md:text-4xl lg:text-[2.625rem]" style={{ animationDelay: '0.15s' }}>
 {isRTL ? 'عمران لخدمات المكاتب الهندسية' : 'Omran for Engineering Services'}
 </p>
 <div className="omran-hero-item" style={{ animationDelay: '0.3s', transform: `translateY(-${scrollOffset}px)`, transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', willChange: 'transform' }}>
 <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
 <Link to="/register" search={{ type: 'client' }}>
 <Button size="lg" className="bg-gradient-gold text-gold-foreground shadow-gold text-base px-8 py-6 hover:opacity-90">
 {isRTL ? 'أنا صاحب مشروع' : "I'm a Project Owner"}<Arrow className="ms-2 h-5 w-5" />
 </Button>
 </Link>
 <Link to="/register" search={{ type: 'office' }}>
 <Button size="lg" variant="outline" className="border-2 border-white/50 text-white bg-white/10 hover:bg-white/20 text-base px-8 py-6">
 {isRTL ? 'أنا مكتب هندسي' : "I'm an Engineering Office"}
 </Button>
 </Link>
 </div>
 <div className="mt-6">
 <Link to="/estimator">
 <Button variant="secondary" size="lg" className="gap-2 text-base px-6 py-5 rounded-full">
 <Calculator className="h-5 w-5" />
 {isRTL ? ' احسب تكلفة مشروعك' : ' Calculate Your Project Cost'}
 </Button>
 </Link>
 </div>
 </div>
 </div>
 </section>

 {/* SECTION 2 — كيف تعمل المنصة */}
 <section className="py-20 lg:py-28 bg-muted/30">
 <div className="mx-auto max-w-7xl px-4">
 <div style={{ transform: `translateY(-${scrollOffset}px)`, transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', willChange: 'transform' }}>
 <h2 className="text-center text-3xl font-black md:text-4xl">
 {isRTL ? 'كيف تعمل المنصة' : 'How It Works'}
 </h2>
 <div className="mt-16 grid gap-12 lg:grid-cols-2">
 <div>
 <h3 className="mb-8 text-center text-xl font-bold text-gold">
 {isRTL ? ' أصحاب المشاريع' : ' Project Owners'}
 </h3>
 <div className="space-y-4">
 {[
 { emoji: '', t: isRTL ? 'احسب تكلفة مشروعك' : 'Calculate your project cost', d: isRTL ? 'أدخل مساحة أرضك واحصل على تقدير فوري' : 'Enter your land area and get an instant estimate' },
 { emoji: '', t: isRTL ? 'انشر طلبك أو احجز مباشرة' : 'Post or book directly', d: isRTL ? 'انشر مشروعك للمكاتب أو اختر خدمة من الكتالوج' : 'Post your project or choose from the catalog' },
 { emoji: '', t: isRTL ? 'قارن العروض بالذكاء الاصطناعي' : 'AI-powered bid comparison', d: isRTL ? 'احصل على توصية ذكية بأفضل عرض' : 'Get smart recommendations' },
 { emoji: '', t: isRTL ? 'وقّع العقد الرقمي' : 'Sign digital contract', d: isRTL ? 'عقد تلقائي + توقيع إلكتروني آمن' : 'Auto-generated contract with e-signature' },
 { emoji: '', t: isRTL ? 'ادفع بنظام الضمان المالي' : 'Pay with escrow', d: isRTL ? 'أموالك محفوظة وتُحرَّر عند اعتماد كل مرحلة' : 'Funds released upon milestone approval' },
 { emoji: '⭐', t: isRTL ? 'قيّم بعد كل مرحلة' : 'Rate each milestone', d: isRTL ? 'تقييم موثّق بعد كل milestone' : 'Verified ratings after each milestone' },
 ].map((step, i) => (
 <div key={i} className="flex items-start gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-gold text-gold-foreground font-bold text-sm shadow-gold">{i + 1}</div>
 <div>
 <h4 className="font-bold">{step.emoji} {step.t}</h4>
 <p className="text-sm text-muted-foreground mt-1">{step.d}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 <div>
 <h3 className="mb-8 text-center text-xl font-bold text-gold">
 {isRTL ? ' المكاتب الهندسية' : ' Engineering Offices'}
 </h3>
 <div className="space-y-4">
 {[
 { emoji: '', t: isRTL ? 'سجّل مكتبك برخصة هيئة المهندسين' : 'Register with engineering license', d: isRTL ? 'تحقق من الترخيص + موافقة المشرف' : 'License verification + supervisor approval' },
 { emoji: '', t: isRTL ? 'أنشئ كتالوج خدماتك' : 'Create your service catalog', d: isRTL ? '8 فئات هندسية مع التسعير' : '8 engineering categories with pricing' },
 { emoji: '', t: isRTL ? 'تصفح الطلبات أو تلقَّ حجوزات مباشرة' : 'Browse requests or receive bookings', d: isRTL ? 'مشاريع مناسبة لتخصصك ومنطقتك' : 'Projects matching your specialty and area' },
 { emoji: '', t: isRTL ? 'قدّم عرضك التنافسي' : 'Submit competitive bid', d: isRTL ? 'سعر + مدة + أعمالك السابقة' : 'Price + timeline + portfolio' },
 { emoji: '', t: isRTL ? 'نفّذ وأرفع المراحل' : 'Execute and upload milestones', d: isRTL ? 'خطة مراحل واضحة + رفع المخرجات' : 'Clear milestone plan + deliverable uploads' },
 { emoji: '', t: isRTL ? 'استلم مدفوعاتك تلقائياً' : 'Receive payments automatically', d: isRTL ? 'يُحرَّر المبلغ فور اعتماد العميل للمرحلة' : 'Funds released upon client approval' },
 ].map((step, i) => (
 <div key={i} className="flex items-start gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-navy text-primary-foreground font-bold text-sm shadow-navy">{i + 1}</div>
 <div>
 <h4 className="font-bold">{step.emoji} {step.t}</h4>
 <p className="text-sm text-muted-foreground mt-1">{step.d}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* SECTION 3 — ماذا نقدم */}
 <section className="py-20 lg:py-28" ref={section3Ref}>
 <div className="mx-auto max-w-7xl px-4">
 <h2 className="text-center text-3xl font-black md:text-4xl">{isRTL ? 'ماذا نقدم' : 'What We Offer'}</h2>
 <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
 {[
 { icon: Bot, title: isRTL ? ' ذكاء اصطناعي متكامل' : ' Integrated AI', desc: isRTL ? 'شات بوت للتوجيه، توليد أوصاف المشاريع، مقارنة ذكية للعروض' : 'Chatbot guidance, description generation, smart bid comparison' },
 { icon: Ruler, title: isRTL ? ' كتالوج هندسي شامل' : ' Comprehensive Catalog', desc: isRTL ? '8 فئات و30+ تخصصاً من التصميم المعماري حتى المساحة' : '8 categories and 30+ specialties' },
 { icon: CreditCard, title: isRTL ? ' نظام ضمان مالي آمن' : ' Secure Escrow', desc: isRTL ? 'أموالك محفوظة وتُحرَّر تدريجياً عند اعتماد كل مرحلة' : 'Funds held safely and released per milestone' },
 { icon: FileText, title: isRTL ? ' عقود رقمية تلقائية' : ' Auto Digital Contracts', desc: isRTL ? 'عقد قانوني يُولَّد تلقائياً بعد قبول العرض مع توقيع إلكتروني' : 'Auto-generated legal contracts with e-signatures' },
 { icon: CheckCircle2, title: isRTL ? ' مكاتب موثّقة ومرخّصة' : ' Verified & Licensed', desc: isRTL ? 'جميع المكاتب مرخّصة من هيئة المهندسين السعوديين' : 'All offices licensed by Saudi Engineering Authority' },
 { icon: Calculator, title: isRTL ? ' حاسبة تكاليف فورية' : ' Instant Cost Calculator', desc: isRTL ? 'تقدير فوري لتكلفة مشروعك قبل التسجيل' : 'Instant cost estimate before registration' },
 ].map((f, i) => (
 <div key={i} className="group rounded-2xl border bg-card p-8 transition-all hover:shadow-xl hover:-translate-y-1" data-reveal-card>
 <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10 text-gold transition-colors group-hover:bg-gradient-gold group-hover:text-gold-foreground">
 <f.icon className="h-7 w-7" />
 </div>
 <h3 className="text-lg font-bold">{f.title}</h3>
 <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* SECTION 4 — مكاتب مميزة */}
 <section className="py-20 lg:py-28 bg-muted/30" ref={section4Ref}>
 <div className="mx-auto max-w-7xl px-4">
 <h2 className="text-center text-3xl font-black md:text-4xl">{isRTL ? 'مكاتب مميزة' : 'Featured Offices'}</h2>
 <div className="mt-12 grid gap-6 md:grid-cols-3">
 {featuredOffices.map((office, i) => (
 <div key={i} className="rounded-2xl border bg-card p-6 transition-all hover:shadow-xl hover:-translate-y-1" data-reveal-card>
 <div className="flex items-start justify-between">
 <div>
 <h3 className="text-lg font-bold">{office.name}</h3>
 <p className="text-sm text-muted-foreground mt-1">{office.city} | {office.type} | {office.experience} {isRTL ? 'سنة خبرة' : 'years'}</p>
 </div>
 <div className="flex items-center gap-1 rounded-full bg-gold/10 px-2 py-1">
 <Star className="h-4 w-4 text-gold fill-gold" />
 <span className="text-sm font-bold text-gold">{office.rating}</span>
 </div>
 </div>
 <div className="mt-4 flex flex-wrap gap-2">
 {office.topServices.map((s, j) => (
 <span key={j} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{s}</span>
 ))}
 </div>
 <p className="mt-4 text-sm font-semibold text-gold">{isRTL ? 'أبرز الأسعار:' : 'Starting from:'} {office.highlight}</p>
 <Link to="/login">
 <Button variant="outline" size="sm" className="mt-4 w-full border-gold text-gold hover:bg-gold hover:text-gold-foreground">
 {isRTL ? 'سجّل لعرض الكتالوج' : 'Sign in to View Catalog'}
 </Button>
 </Link>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* SECTION 5 — Stats */}
 <section className="bg-gradient-navy py-12" ref={section5Ref}>
 <div className="mx-auto max-w-7xl px-4">
 <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
 {[
 { target: 500, prefix: '+', suffix: '', label: isRTL ? 'مشروع منجز' : 'Projects Completed' },
 { target: 120, prefix: '+', suffix: '', label: isRTL ? 'مكتب موثّق' : 'Verified Offices' },
 { target: 8, prefix: '', suffix: '', label: isRTL ? 'فئات هندسية' : 'Engineering Categories' },
 { target: 99, prefix: '', suffix: '%', label: isRTL ? 'رضا العملاء' : 'Client Satisfaction' },
 ].map((stat, i) => (
 <div key={i} className="text-center" data-reveal-card>
 <div className="text-3xl font-black text-white md:text-4xl">
 <CountUp target={stat.target} prefix={stat.prefix} suffix={stat.suffix} />
 </div>
 <div className="mt-1 text-sm text-white/70">{stat.label}</div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* SECTION 6 — CTA */}
 <section className="py-20 lg:py-28" ref={section6Ref}>
 <div className="mx-auto max-w-4xl px-4 text-center">
 <h2 className="text-3xl font-black md:text-4xl">{isRTL ? 'ابدأ مشروعك اليوم' : 'Start Your Project Today'}</h2>
 <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
 {isRTL ? 'انضم إلى آلاف العملاء والمكاتب الهندسية على عمران' : 'Join thousands on Omran'}
 </p>
 <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
 <Link to="/register" search={{ type: 'client' }}>
 <Button size="lg" className="bg-gradient-gold text-gold-foreground shadow-gold px-10 py-6 text-base hover:opacity-90">
 {isRTL ? 'سجّل كصاحب مشروع' : 'Register as Owner'}<Arrow className="ms-2 h-5 w-5" />
 </Button>
 </Link>
 <Link to="/register" search={{ type: 'office' }}>
 <Button size="lg" variant="outline" className="border-2 border-gold text-gold hover:bg-gold hover:text-gold-foreground px-10 py-6 text-base">
 {isRTL ? 'سجّل مكتبك الهندسي' : 'Register Your Office'}
 </Button>
 </Link>
 </div>
 </div>
 </section>
 </div>
 );
}

function CountUp({ target, prefix = '', suffix = '', duration = 1200 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setValue(target); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setValue(Math.round(eased * target));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}
