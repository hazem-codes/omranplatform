-- Public marketplace read policies for client visibility.
-- This matches the current architecture where office services are visible once the office is verified,
-- and templates are visible once approved and available.

ALTER TABLE public.engineering_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'engineering_offices'
      AND policyname = 'public_read_verified_offices'
  ) THEN
    CREATE POLICY public_read_verified_offices
    ON public.engineering_offices
    FOR SELECT
    TO anon, authenticated
    USING (is_verified = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'public_read_engineering_office_profiles'
  ) THEN
    CREATE POLICY public_read_engineering_office_profiles
    ON public.profiles
    FOR SELECT
    TO anon, authenticated
    USING (role = 'engineering_office');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'templates'
      AND policyname = 'public_read_approved_templates'
  ) THEN
    CREATE POLICY public_read_approved_templates
    ON public.templates
    FOR SELECT
    TO anon, authenticated
    USING (is_approved = true AND is_available = true);
  END IF;
END $$;
