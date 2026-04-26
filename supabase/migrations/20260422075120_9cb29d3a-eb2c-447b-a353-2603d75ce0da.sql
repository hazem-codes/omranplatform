-- Add RLS policies for projects and payments tables

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_access" ON public.projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.contract_id = projects.contract_id
        AND (c.client_id = auth.uid() OR c.office_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.supervisors WHERE id = auth.uid())
  );

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_access" ON public.payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.escrow e
      JOIN public.contracts c ON c.contract_id = e.contract_id
      WHERE e.escrow_id = payments.escrow_id
        AND (c.client_id = auth.uid() OR c.office_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.supervisors WHERE id = auth.uid())
  );
