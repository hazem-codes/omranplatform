import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { I18nextProvider } from 'react-i18next';
import { ClientOnly } from '@tanstack/react-router';
import { useEffect } from 'react';
import i18n from '../i18n';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ChatbotWidget } from '@/components/ChatbotWidget';
import { Toaster } from '@/components/ui/sonner';
import { RouteLoadingOverlay } from '@/components/RouteLoadingOverlay';

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-gold px-6 py-2.5 text-sm font-medium text-gold-foreground shadow-gold transition-opacity hover:opacity-90"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "عمران — خدمات هندسية احترافية" },
      { name: "description", content: "عمران تربط أصحاب المشاريع بالمكاتب الهندسية المعتمدة في المملكة العربية السعودية" },
      { property: "og:title", content: "عمران — خدمات هندسية احترافية" },
      { property: "og:description", content: "عمران تربط أصحاب المشاريع بالمكاتب الهندسية المعتمدة في المملكة العربية السعودية" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "عمران — خدمات هندسية احترافية" },
      { name: "twitter:description", content: "عمران تربط أصحاب المشاريع بالمكاتب الهندسية المعتمدة في المملكة العربية السعودية" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d3c0d38e-93a6-4e72-b574-00ec0eeadde5/id-preview-a94f0084--5feeaa8f-230f-47f2-b50c-e641f3ce0e1f.lovable.app-1777166428675.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d3c0d38e-93a6-4e72-b574-00ec0eeadde5/id-preview-a94f0084--5feeaa8f-230f-47f2-b50c-e641f3ce0e1f.lovable.app-1777166428675.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
     links: [
       { rel: "stylesheet", href: appCss },
       { rel: "icon", type: "image/png", href: "/omran-logo.png" },
       { rel: "apple-touch-icon", href: "/omran-logo.png" },
     ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    document.body.classList.add('omran-page-entered');
  }, []);
  return (
    <I18nextProvider i18n={i18n}>
      <ClientOnly fallback={
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
      }>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                <Outlet />
              </main>
              <Footer />
              <ChatbotWidget />
              <Toaster />
              <RouteLoadingOverlay />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </ClientOnly>
    </I18nextProvider>
  );
}
