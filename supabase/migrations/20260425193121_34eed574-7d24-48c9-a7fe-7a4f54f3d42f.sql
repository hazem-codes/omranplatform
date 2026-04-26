-- Allow any signed-in user to read public office info for verified+active offices.
-- This is the minimum needed so the client marketplace can show the office identity
-- (name, city, coverage, verification, type, experience).
-- Suspended or unverified offices remain hidden from the public.

CREATE POLICY "engineering_offices_public_read"
  ON public.engineering_offices
  FOR SELECT
  TO authenticated
  USING (is_active = true AND COALESCE(is_verified, false) = true);

-- Allow any signed-in user to read the basic name of engineering office profiles
-- so we can label services/templates with the seller office name.
CREATE POLICY "profiles_public_read_offices"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (role = 'engineering_office');
