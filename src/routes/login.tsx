import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { ChevronDown, Copy } from 'lucide-react';
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
 <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="password">{t('auth.password')}</Label>
 <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required dir="ltr" />
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

 <DemoAccountsPanel />

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

const DEMO_ACCOUNTS = [
 { role: 'عميل', email: 'client@mimaar.demo', password: 'Demo@1234' },
 { role: 'مكتب هندسي', email: 'office@mimaar.demo', password: 'Demo@1234' },
 { role: 'مشرف', email: 'supervisor@mimaar.demo', password: 'Demo@1234' },
];

function DemoAccountsPanel() {
 const [open, setOpen] = useState(false);

 const copy = async (val: string, label: string) => {
 try {
 await navigator.clipboard.writeText(val);
 toast.success(`تم نسخ ${label}`);
 } catch {
 toast.error('فشل النسخ');
 }
 };

 return (
 <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border bg-card">
 <CollapsibleTrigger asChild>
 <button
 type="button"
 className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-foreground hover:bg-accent/40 rounded-2xl"
 >
 <span className="flex items-center gap-2">
 حسابات تجريبية
 <span className="rounded-full border bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
 للاختبار والعرض فقط
 </span>
 </span>
 <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
 </button>
 </CollapsibleTrigger>
 <CollapsibleContent className="border-t">
 <div className="divide-y">
 {DEMO_ACCOUNTS.map((acc) => (
 <div key={acc.email} className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-[100px_1fr_1fr]">
 <div className="text-sm font-semibold text-primary">{acc.role}</div>
 <div className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1">
 <span className="truncate text-xs" dir="ltr">{acc.email}</span>
 <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy(acc.email, 'البريد')}>
 <Copy className="h-3.5 w-3.5" />
 <span className="ms-1 text-xs">نسخ</span>
 </Button>
 </div>
 <div className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1">
 <span className="truncate text-xs" dir="ltr">{acc.password}</span>
 <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => copy(acc.password, 'كلمة المرور')}>
 <Copy className="h-3.5 w-3.5" />
 <span className="ms-1 text-xs">نسخ</span>
 </Button>
 </div>
 </div>
 ))}
 </div>
 </CollapsibleContent>
 </Collapsible>
 );
}
