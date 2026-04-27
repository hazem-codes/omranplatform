import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { User, Building2, ShieldCheck } from 'lucide-react';
import { resolvePostAuthDestination } from '@/services/authRoutingService';
import omranLogo from '@/assets/omran-logo.png';

export const Route = createFileRoute('/login')({
 component: LoginPage,
});

function LoginPage() {
 const { t, i18n } = useTranslation();
 const { login, isAuthenticated, isLoading } = useAuth();
 const navigate = useNavigate();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);
 const [highlightFields, setHighlightFields] = useState(false);
 const [suspendedMsg, setSuspendedMsg] = useState<string | null>(null);
 const isRTL = i18n.language === 'ar';

 const suspensionText = isRTL
 ? 'حسابك موقوف من إدارة المنصة، لا يمكنك تسجيل الدخول.'
 : 'Your account has been suspended by platform administration. You cannot sign in.';

 // Read and clear the suspension flag set by AuthContext when a suspended session is killed.
 useEffect(() => {
 try {
 if (sessionStorage.getItem('omran:suspended') === '1') {
 setSuspendedMsg(suspensionText);
 sessionStorage.removeItem('omran:suspended');
 }
 } catch {}
 }, [suspensionText]);

 // Redirect if already logged in
 useEffect(() => {
 if (isLoading || !isAuthenticated) return;
 let cancelled = false;

 (async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user || cancelled) return;
 const dest = await resolvePostAuthDestination(user.id);
 if (cancelled) return;
 setEmail('');
 setPassword('');
 navigate({ to: dest as '/' });
 })();

 return () => {
 cancelled = true;
 };
 }, [isAuthenticated, isLoading, navigate]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setSuspendedMsg(null);
 try {
 await login(email, password);
 // Give AuthContext a tick to run its is_active check and possibly sign out.
 await new Promise((r) => setTimeout(r, 250));
 try {
 if (sessionStorage.getItem('omran:suspended') === '1') {
 sessionStorage.removeItem('omran:suspended');
 setSuspendedMsg(suspensionText);
 toast.error(suspensionText);
 return;
 }
 } catch {}
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 toast.success(t('auth.login') + ' ');
 const dest = await resolvePostAuthDestination(user.id);
 navigate({ to: dest as '/' });
 }
 } catch (err: any) {
 toast.error(err.message || 'Login failed');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="flex min-h-[80vh] items-center justify-center px-4">
 <div className="w-full max-w-md space-y-8">
 <div className="text-center">
 <img src={omranLogo} alt="Omran" className="mx-auto mb-4 h-32 w-32 object-contain" />
 <h1 className="text-2xl font-black">{t('auth.login')}</h1>
 <p className="mt-2 text-sm text-muted-foreground">{t('app.tagline')}</p>
 </div>

 {suspendedMsg && (
 <div
 role="alert"
 className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
 >
 {suspendedMsg}
 </div>
 )}

 {!isLoading && !isAuthenticated && (
 <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-8 shadow-lg">
 <div className="space-y-2">
 <Label htmlFor="email">{t('auth.email')}</Label>
 <Input
   id="email"
   type="email"
   value={email}
   onChange={e => setEmail(e.target.value)}
   required
   dir="ltr"
   className={highlightFields ? 'ring-2 ring-gold/60 transition-all duration-500' : 'transition-all duration-500'}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="password">{t('auth.password')}</Label>
 <Input
   id="password"
   type="password"
   value={password}
   onChange={e => setPassword(e.target.value)}
   required
   dir="ltr"
   className={highlightFields ? 'ring-2 ring-gold/60 transition-all duration-500' : 'transition-all duration-500'}
 />
 </div>
 <Button type="submit" className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" disabled={loading}>
 {loading ? t('common.loading') : t('auth.login')}
 </Button>

 <div className="relative my-2">
 <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
 <span className="relative flex justify-center text-xs uppercase">
 <span className="bg-card px-2 text-muted-foreground">{i18n.language === 'ar' ? 'أو استخدم' : 'Or use'}</span>
 </span>
 </div>

 <GoogleSignInButton isRTL={i18n.language === 'ar'} mode="login" redirectPath="/login" />
 </form>
 )}

 <DemoAccountsPanel
   isRTL={isRTL}
   onFill={(creds) => {
     setEmail(creds.email);
     setPassword(creds.password);
     setHighlightFields(true);
     window.setTimeout(() => setHighlightFields(false), 900);
   }}
 />

 <p className="text-center text-sm text-muted-foreground">
 {t('auth.no_account')}{' '}
 <Link to="/register" className="font-medium text-gold hover:underline">
 {t('auth.register')}
 </Link>
 </p>
 </div>
 </div>
 );
}

type DemoCreds = { email: string; password: string };

const DEMO_ACCOUNTS: Array<{
 key: 'client' | 'office' | 'supervisor';
 ar: string;
 en: string;
 icon: typeof User;
 email: string;
 password: string;
}> = [
  { key: 'client', ar: 'عميل تجريبي', en: 'Demo Client', icon: User, email: 'client@omran.demo', password: 'Demo@1234' },
  { key: 'office', ar: 'مكتب هندسي تجريبي', en: 'Demo Engineering Office', icon: Building2, email: 'office@omran.demo', password: 'Demo@1234' },
  { key: 'supervisor', ar: 'مشرف تجريبي', en: 'Demo Supervisor', icon: ShieldCheck, email: 'supervisor@omran.demo', password: 'Demo@1234' },
];

function DemoAccountsPanel({ isRTL, onFill }: { isRTL: boolean; onFill: (creds: DemoCreds) => void }) {
 const [activeKey, setActiveKey] = useState<string | null>(null);

 const handleClick = (acc: typeof DEMO_ACCOUNTS[number]) => {
   setActiveKey(acc.key);
   onFill({ email: acc.email, password: acc.password });
   toast.success(isRTL ? `تم تعبئة بيانات ${acc.ar}` : `Filled ${acc.en} credentials`);
   window.setTimeout(() => setActiveKey(null), 900);
 };

 return (
   <div className="rounded-2xl border bg-card p-4 shadow-sm">
     <div className="mb-3 flex items-center justify-between">
       <span className="text-sm font-semibold text-foreground">
         {isRTL ? 'حسابات تجريبية' : 'Demo Accounts'}
       </span>
       <span className="rounded-full border bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
         {isRTL ? 'للاختبار والعرض فقط' : 'For testing & demo only'}
       </span>
     </div>
     <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
       {DEMO_ACCOUNTS.map((acc) => {
         const Icon = acc.icon;
         const isActive = activeKey === acc.key;
         return (
           <button
             key={acc.key}
             type="button"
             onClick={() => handleClick(acc)}
             className={`group flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:bg-gold/5 hover:shadow-md ${
               isActive ? 'border-gold bg-gold/10 ring-2 ring-gold/40 scale-[1.02]' : 'border-border bg-background'
             }`}
             aria-label={isRTL ? acc.ar : acc.en}
           >
             <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-gold text-gold-foreground' : 'bg-accent text-foreground group-hover:bg-gold/20 group-hover:text-gold'}`}>
               <Icon className="h-4 w-4" />
             </span>
             <span className="text-xs font-semibold text-foreground leading-tight">
               {isRTL ? acc.ar : acc.en}
             </span>
             <div className="mt-1 w-full space-y-0.5 border-t border-dashed pt-1.5" dir="ltr">
               <div className="flex items-center justify-between gap-1 text-[10px]">
                 <span className="text-muted-foreground/70 shrink-0">Email</span>
                 <span className="font-mono text-foreground/80 truncate">{acc.email}</span>
               </div>
               <div className="flex items-center justify-between gap-1 text-[10px]">
                 <span className="text-muted-foreground/70 shrink-0">Pass</span>
                 <span className="font-mono text-foreground/80 truncate">{acc.password}</span>
               </div>
             </div>
           </button>
         );
       })}
     </div>
   </div>
 );
}
