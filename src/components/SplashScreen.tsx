import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import omranLogo from '@/assets/omran-logo.png';

const SESSION_KEY = 'omran_splash_shown';

export function SplashScreen() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [show, setShow] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    setShow(true);
    // Hold then fade out: logo 0.8s + text stagger 0.4s + hold 0.5s ≈ 1.7s
    const t1 = setTimeout(() => setHiding(true), 1700);
    const t2 = setTimeout(() => setShow(false), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#0d2240',
        opacity: hiding ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
        pointerEvents: hiding ? 'none' : 'auto',
      }}
    >
      <style>{`
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes splashTextIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <img
        src={omranLogo}
        alt="Omran"
        className="h-24 w-24 object-contain"
        style={{
          animation: 'splashLogoIn 0.8s ease-out both',
          filter: 'brightness(0) invert(1)',
        }}
      />
      <div className="mt-6 flex flex-col items-center text-white">
        {isRTL ? (
          <>
            <span
              dir="rtl"
              className="text-2xl"
              style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 700, animation: 'splashTextIn 0.5s ease-out 0.9s both' }}
            >
              عَمّر بيتك
            </span>
            <span
              dir="rtl"
              className="text-2xl"
              style={{ fontFamily: 'Tajawal, sans-serif', fontWeight: 700, animation: 'splashTextIn 0.5s ease-out 1.1s both' }}
            >
              مع عمران
            </span>
          </>
        ) : (
          <>
            <span
              className="text-base"
              style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, letterSpacing: '0.15em', animation: 'splashTextIn 0.5s ease-out 0.9s both' }}
            >
              BUILD YOUR HOME
            </span>
            <span
              className="text-base"
              style={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, letterSpacing: '0.15em', animation: 'splashTextIn 0.5s ease-out 1.1s both' }}
            >
              WITH OMRAN
            </span>
          </>
        )}
      </div>
    </div>
  );
}
