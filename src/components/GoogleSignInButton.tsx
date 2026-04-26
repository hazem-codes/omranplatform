import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleSignInButtonProps {
  isRTL?: boolean;
  mode?: 'login' | 'signup' | 'auto';
  redirectPath?: string;
}

export function GoogleSignInButton({ isRTL = false, mode = 'auto', redirectPath = '/login' }: GoogleSignInButtonProps) {
  const handleGoogle = async () => {
    try {
      const currentOrigin =
        typeof window !== 'undefined' && window.location?.origin
          ? window.location.origin
          : '';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: `${currentOrigin}${redirectPath}`,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) throw error;
      if (data?.url) {
        if (typeof window !== 'undefined' && window.top) {
          try {
            window.top.location.href = data.url;
            return;
          } catch {
            window.location.href = data.url;
            return;
          }
        }
        window.location.href = data.url;
      }
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (msg.toLowerCase().includes('redirect') || msg.includes('403')) {
        toast.error(
          isRTL
            ? 'أضف نطاق التطبيق الحالي إلى Redirect URLs في Supabase Auth'
            : 'Add the current app domain to Supabase Auth redirect URLs'
        );
      } else {
        toast.error(msg || (isRTL ? 'تعذر تسجيل الدخول بحساب Google' : 'Google sign-in failed'));
      }
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2"
      onClick={handleGoogle}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
      </svg>
      {mode === 'login'
        ? (isRTL ? 'تسجيل الدخول باستخدام Google' : 'Sign in with Google')
        : mode === 'signup'
          ? (isRTL ? 'إنشاء حساب باستخدام Google' : 'Create account with Google')
          : (isRTL ? 'المتابعة باستخدام Google' : 'Continue with Google')}
    </Button>
  );
}
