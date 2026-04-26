import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import omranLogo from '@/assets/omran-logo.png';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={omranLogo} alt="Omran" className="h-20 w-20 object-contain" />
              <span className="text-xl font-bold">{t('app.name')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t('app.tagline')}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 font-semibold">{t('nav.services')}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">{t('catalog.categories.architectural')}</Link>
              <Link to="/" className="hover:text-foreground transition-colors">{t('catalog.categories.structural')}</Link>
              <Link to="/" className="hover:text-foreground transition-colors">{t('catalog.categories.electrical')}</Link>
              <Link to="/" className="hover:text-foreground transition-colors">{t('catalog.categories.supervision')}</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 font-semibold">{t('nav.about')}</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span>info@omran.sa</span>
              <span>+966 11 000 0000</span>
              <span>الرياض، المملكة العربية السعودية</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {t('app.name')}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
