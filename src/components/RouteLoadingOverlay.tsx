import { useRouterState } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';

export function RouteLoadingOverlay() {
  const status = useRouterState({ select: (state) => state.status });
  const isNavigating = status === 'pending';

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
      <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin text-gold" />
        <span className="text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}
