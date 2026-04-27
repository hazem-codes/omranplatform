import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

/**
 * Ensure the authenticated supervisor has a row in public.supervisors.
 *
 * Why this exists:
 * Every supervisor RLS policy on project_requests, clients, engineering_offices,
 * profiles, templates, and reports checks `EXISTS (SELECT 1 FROM public.supervisors
 * WHERE id = auth.uid())`. If a supervisor account was created via the regular
 * signup flow (or before the supervisors table existed), no row exists there and
 * every supervisor query silently returns zero rows — which broke the request
 * review workflow (client → supervisor → office).
 *
 * RLS on the `supervisors` table itself blocks self-insert from the client, so
 * this self-heal must run server-side with the service-role admin client.
 */
export const ensureSupervisorRow = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };

    // Verify the caller really is a supervisor (defense in depth — never trust
    // the client to claim a role).
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);
    if (!profile || profile.role !== 'supervisor') {
      return { ok: false, reason: 'not_supervisor' as const };
    }

    const { error: insertError } = await supabaseAdmin
      .from('supervisors')
      .upsert({ id: userId }, { onConflict: 'id' });

    if (insertError) throw new Error(insertError.message);
    return { ok: true as const };
  });
