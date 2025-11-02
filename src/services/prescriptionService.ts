import { supabase } from '@/integrations/supabase/client';
import {
  PrescriptionFile,
  PrescriptionUploadOptions,
  PrescriptionValidationResult,
  DEFAULT_PRESCRIPTION_OPTIONS,
  isValidPrescriptionFileType,
  generateUniqueFileName
} from '@/types/prescription';

class PrescriptionService {
  private storageBucket = 'prescriptions';

  /**
   * Validate prescription file before upload
   */
  validatePrescriptionFile(file: File, options: PrescriptionUploadOptions = {}): PrescriptionValidationResult {
    const opts = { ...DEFAULT_PRESCRIPTION_OPTIONS, ...options };

    // Check file size
    if (file.size > opts.maxSize!) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(opts.maxSize! / 1024 / 1024)}MB`,
        fileSize: file.size,
      };
    }

    // Check file type
    if (!isValidPrescriptionFileType(file)) {
      return {
        isValid: false,
        error: 'Invalid file type. Only JPG, PNG, and PDF files are allowed',
        fileType: file.type,
      };
    }

    // Basic content validation
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty',
      };
    }

    return {
      isValid: true,
      fileType: file.type,
      fileSize: file.size,
    };
  }

  /**
   * Upload prescription file to Supabase storage and database
   */
  async uploadPrescriptionFile(
    file: File,
    userId: string,
    productId: string,
    options: PrescriptionUploadOptions = {}
  ): Promise<PrescriptionFile> {
    const validation = this.validatePrescriptionFile(file, options);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      // Get current user session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Generate unique file path
      const uniqueFileName = generateUniqueFileName(file.name);
      const filePath = `${userId}/${productId}/${uniqueFileName}`;

      // Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.storageBucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Create database record
      const prescriptionData: Omit<PrescriptionFile, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        product_id: productId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        upload_status: 'uploaded',
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('prescription_uploads')
        .insert(prescriptionData)
        .select()
        .single();

      if (insertError) {
        // Clean up uploaded file if database insert fails
        await supabase.storage
          .from(this.storageBucket)
          .remove([filePath]);

        throw new Error(`Failed to save prescription record: ${insertError.message}`);
      }

      return insertedData as PrescriptionFile;
    } catch (error) {
      console.error('Prescription upload error:', error);
      throw error;
    }
  }

  /**
   * Delete prescription file from storage and database
   */
  async deletePrescriptionFile(uploadId: string, userId: string): Promise<void> {
    try {
      // Get prescription record first
      const { data: prescription, error: fetchError } = await supabase
        .from('prescription_uploads')
        .select('*')
        .eq('id', uploadId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to find prescription record: ${fetchError.message}`);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('prescription_uploads')
        .delete()
        .eq('id', uploadId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(`Failed to delete prescription record: ${deleteError.message}`);
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.storageBucket)
        .remove([prescription.file_path]);

      if (storageError) {
        console.warn('Failed to delete file from storage:', storageError);
        // Don't throw error here as database record is deleted
      }
    } catch (error) {
      console.error('Prescription deletion error:', error);
      throw error;
    }
  }

  /**
   * Get prescription file URL for viewing/downloading
   */
  async getPrescriptionUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(this.storageBucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        throw new Error(`Failed to generate prescription URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting prescription URL:', error);
      throw error;
    }
  }

  /**
   * Get public URL for prescription file (if bucket is public)
   */
  getPublicPrescriptionUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.storageBucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Get all prescriptions for a user
   */
  async getUserPrescriptions(userId: string, productId?: string): Promise<PrescriptionFile[]> {
    try {
      let query = supabase
        .from('prescription_uploads')
        .select('*')
        .eq('user_id', userId)
        .eq('upload_status', 'uploaded')
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch prescriptions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user prescriptions:', error);
      throw error;
    }
  }

  /**
   * Get prescriptions for a specific product
   */
  async getPrescriptionsForProduct(userId: string, productId: string): Promise<PrescriptionFile[]> {
    return this.getUserPrescriptions(userId, productId);
  }

  /**
   * Check if user has uploaded prescription for a product
   */
  async hasUserUploadedPrescription(userId: string, productId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('prescription_uploads')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('upload_status', 'uploaded')
        .limit(1);

      if (error) {
        console.error('Error checking prescription status:', error);
        return false;
      }

      return (data && data.length > 0) || false;
    } catch (error) {
      console.error('Error checking prescription status:', error);
      return false;
    }
  }

  /**
   * Update prescription upload status
   */
  async updatePrescriptionStatus(
    uploadId: string,
    userId: string,
    status: PrescriptionFile['upload_status']
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('prescription_uploads')
        .update({
          upload_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', uploadId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update prescription status: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating prescription status:', error);
      throw error;
    }
  }

  /**
   * Initialize storage bucket if it doesn't exist
   */
  async initializeStorageBucket(): Promise<void> {
    try {
      // Note: This requires admin privileges and should be called from a server-side function
      // For now, we'll assume the bucket exists or is created via migration
      console.log('Prescription storage bucket initialization skipped (requires admin access)');
    } catch (error) {
      console.error('Error initializing storage bucket:', error);
    }
  }
}

export const prescriptionService = new PrescriptionService();