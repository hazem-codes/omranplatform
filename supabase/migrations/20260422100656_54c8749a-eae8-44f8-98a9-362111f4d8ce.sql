
-- Supervisors can read all profiles
CREATE POLICY "supervisor_read_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);

-- Supervisors can read all clients
CREATE POLICY "supervisor_read_clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);

-- Supervisors can update clients (suspend/activate)
CREATE POLICY "supervisor_update_clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);

-- Supervisors can read all engineering offices
CREATE POLICY "supervisor_read_offices"
ON public.engineering_offices
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);

-- Supervisors can update engineering offices (verify/reject)
CREATE POLICY "supervisor_update_offices"
ON public.engineering_offices
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);

-- Supervisors can read all project requests
CREATE POLICY "supervisor_read_project_requests"
ON public.project_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);

-- Supervisors can update project requests (approve/reject)
CREATE POLICY "supervisor_update_project_requests"
ON public.project_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);

-- Supervisors can read all templates
CREATE POLICY "supervisor_read_templates"
ON public.templates
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);

-- Supervisors can update templates (approve/reject)
CREATE POLICY "supervisor_update_templates"
ON public.templates
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);

-- Supervisors can read all reports
CREATE POLICY "supervisor_read_reports"
ON public.reports
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);

-- Supervisors can update reports (resolve disputes)
CREATE POLICY "supervisor_update_reports"
ON public.reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.supervisors WHERE supervisors.id = auth.uid())
);
