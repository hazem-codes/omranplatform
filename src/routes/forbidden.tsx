import { createFileRoute, Link } from '@tanstack/react-router';
import { ShieldAlert } from 'lucide-react';

export const Route = createFileRoute('/forbidden')({
  component: ForbiddenPage,
});

function ForbiddenPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-5xl font-black text-primary">403</h1>
        <h2 className="mt-3 text-xl font-semibold">غير مصرح بالوصول</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ليس لديك صلاحية لعرض هذه الصفحة.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border bg-card px-6 py-2.5 text-sm font-medium hover:bg-accent"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
