-- ============================================================================
-- Fix: Request Workflow Visibility
-- ============================================================================
-- Run this once in the Supabase SQL editor.
--
-- Problem
-- -------
-- Every supervisor RLS policy on project_requests, clients, engineering_offices,
-- profiles, templates, and reports relies on:
--     EXISTS (SELECT 1 FROM public.supervisors WHERE id = auth.uid())
--
-- Supervisor accounts created through the regular signup flow (or any account
-- created before the supervisors table existed) have a profiles row with
-- role='supervisor' but NO matching row in public.supervisors. As a result:
--   * supervisor reads silently return zero rows,
--   * the supervisor dashboard shows no pending requests,
--   * approved requests therefore never reach the offices,
--   * the entire client → supervisor → office workflow appears broken.
--
-- Fix
-- ---
-- 1. Backfill public.supervisors from any profile with role='supervisor'.
-- 2. Install a trigger that keeps the two in sync going forward.
-- ============================================================================

INSERT INTO public.supervisors (id)
SELECT p.id
FROM public.profiles p
WHERE p.role = 'supervisor'
  AND NOT EXISTS (SELECT 1 FROM public.supervisors s WHERE s.id = p.id)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.ensure_supervisor_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'supervisor' THEN
    INSERT INTO public.supervisors (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_ensure_supervisor_row ON public.profiles;
CREATE TRIGGER profiles_ensure_supervisor_row
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_supervisor_row();

-- Verification
-- ------------
-- After running, every supervisor profile should have a matching row:
--   SELECT p.id, p.email, (s.id IS NOT NULL) AS has_supervisor_row
--   FROM public.profiles p
--   LEFT JOIN public.supervisors s ON s.id = p.id
--   WHERE p.role = 'supervisor';
