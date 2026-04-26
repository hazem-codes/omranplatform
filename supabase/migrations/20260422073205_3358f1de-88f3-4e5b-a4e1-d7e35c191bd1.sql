
-- Add price column to service_catalog
ALTER TABLE public.service_catalog ADD COLUMN IF NOT EXISTS price numeric DEFAULT NULL;

-- Create storage bucket for license files
INSERT INTO storage.buckets (id, name, public) VALUES ('license-files', 'license-files', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: anyone can view license files
CREATE POLICY "License files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'license-files');

-- Policy: authenticated users can upload their own license file
CREATE POLICY "Users can upload their own license"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'license-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: users can update their own license file
CREATE POLICY "Users can update their own license"
ON storage.objects FOR UPDATE
USING (bucket_id = 'license-files' AND auth.uid()::text = (storage.foldername(name))[1]);
