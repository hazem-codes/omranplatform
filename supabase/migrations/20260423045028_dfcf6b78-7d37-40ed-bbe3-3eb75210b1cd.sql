-- Add target_office_id to distinguish ready-service bookings from custom requests
ALTER TABLE public.project_requests
  ADD COLUMN IF NOT EXISTS target_office_id uuid REFERENCES public.engineering_offices(id);

-- Prevent duplicate active bids per office per request
CREATE UNIQUE INDEX IF NOT EXISTS bids_unique_active_per_office_request
  ON public.bids (request_id, office_id)
  WHERE status != 'withdrawn';