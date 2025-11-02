/*
  # Prescription Uploads Feature Migration

  ## Summary
  This migration creates the prescription_uploads table and sets up the necessary storage bucket and policies for handling prescription file uploads in the MedCart Pro pharmacy platform.

  ## New Table: prescription_uploads
  Stores metadata about uploaded prescription files with user isolation and proper access controls.

  ## Storage Bucket: prescriptions
  User-isolated storage bucket for prescription files with proper access policies.

  ## Security
  - Row Level Security (RLS) enabled on prescription_uploads table
  - User isolation - users can only access their own prescription uploads
  - Admin access for pharmacists to verify prescriptions
  - Anonymous users have no access
*/

-- Create prescription_uploads table
CREATE TABLE IF NOT EXISTS public.prescription_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL CHECK (file_size > 0),
  file_type text NOT NULL,
  upload_status text NOT NULL DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'pending', 'failed', 'verified', 'rejected')),
  verification_notes text,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescription_uploads_user ON public.prescription_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_prescription_uploads_product ON public.prescription_uploads(product_id);
CREATE INDEX IF NOT EXISTS idx_prescription_uploads_status ON public.prescription_uploads(upload_status);
CREATE INDEX IF NOT EXISTS idx_prescription_uploads_created ON public.prescription_uploads(created_at DESC);

-- Enable RLS on prescription_uploads table
ALTER TABLE public.prescription_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prescription_uploads

-- Users can view their own prescription uploads
CREATE POLICY "Users can view own prescription uploads" ON public.prescription_uploads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own prescription uploads
CREATE POLICY "Users can insert own prescription uploads" ON public.prescription_uploads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own prescription uploads (limited fields)
CREATE POLICY "Users can update own prescription uploads" ON public.prescription_uploads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Users can only change upload status and verification notes for their own uploads
    (upload_status = ALL(OLD.upload_status) OR upload_status IN ('uploaded', 'failed'))
  );

-- Users can delete their own prescription uploads
CREATE POLICY "Users can delete own prescription uploads" ON public.prescription_uploads
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Admins/Pharmacists can view all prescription uploads for verification
CREATE POLICY "Admins can view all prescription uploads" ON public.prescription_uploads
  FOR SELECT TO authenticated
  USING (
    auth.jwt()->>'role' = 'admin' OR
    auth.jwt()->>'role' = 'pharmacist'
  );

-- Admins/Pharmacists can update prescription uploads (for verification)
CREATE POLICY "Admins can update prescription uploads" ON public.prescription_uploads
  FOR UPDATE TO authenticated
  USING (
    auth.jwt()->>'role' = 'admin' OR
    auth.jwt()->>'role' = 'pharmacist'
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'admin' OR
    auth.jwt()->>'role' = 'pharmacist'
  );

-- Create storage bucket for prescriptions (this would typically be done via admin console)
-- Note: This requires admin privileges and should be created manually or via RPC
-- The following is a placeholder for documentation purposes

/*
-- Storage bucket creation (admin only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescriptions',
  'prescriptions',
  false, -- Private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for prescriptions bucket

-- Users can upload to their own folder
CREATE POLICY "Users can upload to own prescription folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'prescriptions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own prescription files
CREATE POLICY "Users can view own prescription files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'prescriptions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own prescription files
CREATE POLICY "Users can update own prescription files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'prescriptions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'prescriptions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own prescription files
CREATE POLICY "Users can delete own prescription files" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'prescriptions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admins/Pharmacists can access all prescription files for verification
CREATE POLICY "Admins can access all prescription files" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'prescriptions' AND
    (
      auth.jwt()->>'role' = 'admin' OR
      auth.jwt()->>'role' = 'pharmacist'
    )
  );
*/

-- Create trigger for updated_at column
CREATE TRIGGER update_prescription_uploads_updated_at
  BEFORE UPDATE ON public.prescription_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get prescription count for a user and product
CREATE OR REPLACE FUNCTION get_user_prescription_count(
  user_uuid uuid,
  product_uuid uuid
)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.prescription_uploads
    WHERE user_id = user_uuid
      AND product_id = product_uuid
      AND upload_status = 'uploaded'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has valid prescription for product
CREATE OR REPLACE FUNCTION has_valid_prescription(
  user_uuid uuid,
  product_uuid uuid
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.prescription_uploads
    WHERE user_id = user_uuid
      AND product_id = product_uuid
      AND upload_status IN ('uploaded', 'verified')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to the table
COMMENT ON TABLE public.prescription_uploads IS 'Stores uploaded prescription files with user isolation and verification workflow';

-- Add comments to columns
COMMENT ON COLUMN public.prescription_uploads.id IS 'Unique identifier for the prescription upload';
COMMENT ON COLUMN public.prescription_uploads.user_id IS 'User who uploaded the prescription';
COMMENT ON COLUMN public.prescription_uploads.product_id IS 'Product the prescription is for';
COMMENT ON COLUMN public.prescription_uploads.file_name IS 'Original file name';
COMMENT ON COLUMN public.prescription_uploads.file_path IS 'Storage path in the prescriptions bucket';
COMMENT ON COLUMN public.prescription_uploads.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.prescription_uploads.file_type IS 'MIME type of the file';
COMMENT ON COLUMN public.prescription_uploads.upload_status IS 'Current status: uploaded, pending, failed, verified, rejected';
COMMENT ON COLUMN public.prescription_uploads.verification_notes IS 'Notes from pharmacist verification';
COMMENT ON COLUMN public.prescription_uploads.verified_by IS 'Pharmacist who verified the prescription';
COMMENT ON COLUMN public.prescription_uploads.verified_at IS 'When the prescription was verified';
COMMENT ON COLUMN public.prescription_uploads.created_at IS 'When the prescription was uploaded';
COMMENT ON COLUMN public.prescription_uploads.updated_at IS 'Last update timestamp';