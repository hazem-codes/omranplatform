import { supabase } from '@/integrations/supabase/client';
import type { ProfileData } from '@/types';

type AppRole = ProfileData['role'];

export function getRoleDestination(role: AppRole | null) {
  return role === 'client'
    ? '/client/home'
    : role === 'engineering_office'
      ? '/office/home'
      : role === 'supervisor'
        ? '/supervisor/dashboard'
        : '/';
}

export async function resolvePostAuthDestination(userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('id', userId)
    .maybeSingle();

  if (!profile?.id || !profile?.role) {
    return '/register?onboarding=1';
  }

  // Normalize legacy/short role value 'office' → canonical 'engineering_office'.
  const rawRole = profile.role as string;
  const role = (rawRole === 'office' ? 'engineering_office' : rawRole) as AppRole;

  if (role === 'client') {
    const { data: client } = await supabase
      .from('clients')
      .select('id, phone')
      .eq('id', userId)
      .maybeSingle();

    if (!client?.id || !profile.name?.trim() || !client.phone?.trim()) {
      return '/register?onboarding=1';
    }
  }

  if (role === 'engineering_office') {
    const { data: office } = await supabase
      .from('engineering_offices')
      .select('id, license_number, phone, city, office_type')
      .eq('id', userId)
      .maybeSingle();

    if (
      !office?.id ||
      !profile.name?.trim() ||
      !office.license_number?.trim() ||
      !office.phone?.trim() ||
      !office.city?.trim() ||
      !office.office_type?.trim()
    ) {
      return '/register?onboarding=1';
    }
  }

  if (role === 'supervisor') {
    // Supervisor RLS policies on project_requests, clients, offices, etc. require
    // a row in public.supervisors. If the supervisor account was created via signup
    // (not via completeOnboarding), the row may be missing — every supervisor query
    // would then silently return zero rows and break the request review workflow.
    // Self-heal via a server function (RLS blocks the client from inserting itself).
    const { data: supervisor } = await supabase
      .from('supervisors')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!supervisor?.id) {
      try {
        const { ensureSupervisorRow } = await import('./ensureSupervisorRow.server');
        await ensureSupervisorRow();
      } catch {
        // Best effort — the profile.role is the source of truth for routing.
      }
    }

    if (!profile.name?.trim()) {
      return '/register?onboarding=1';
    }
  }

  return getRoleDestination(role);
}

export async function completeOnboarding(
  userId: string,
  input: {
    email: string;
    name: string;
    role: AppRole;
    phone?: string;
    license_number?: string;
    license_expiry_date?: string;
    city?: string;
    office_type?: string;
    years_of_experience?: string;
    coverage_areas?: string[];
    description?: string;
  }
) {
  await supabase.from('profiles').upsert({
    id: userId,
    email: input.email,
    name: input.name,
    role: input.role,
  });

  if (input.role === 'client') {
    await supabase.from('clients').upsert({
      id: userId,
      phone: input.phone?.trim() || null,
    });
  }

  if (input.role === 'engineering_office') {
    await supabase.from('engineering_offices').upsert({
      id: userId,
      license_number: input.license_number?.trim() || '',
      license_expiry_date: input.license_expiry_date?.trim() || null,
      coverage_area: input.coverage_areas?.join('، ') || null,
      description: input.description?.trim() || null,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      office_type: input.office_type?.trim() || null,
      years_of_experience: input.years_of_experience?.trim() || null,
    } as any);
  }

  if (input.role === 'supervisor') {
    await supabase.from('supervisors').upsert({
      id: userId,
      phone: input.phone?.trim() || null,
    });
  }

  return getRoleDestination(input.role);
}
