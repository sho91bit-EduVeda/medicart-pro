import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { prescriptionService } from '@/services/prescriptionService';
import { PrescriptionFile, PrescriptionUploadOptions } from '@/types/prescription';
import { toast } from 'sonner';

interface PrescriptionUploadState {
  // State
  uploadedFiles: PrescriptionFile[];
  isUploading: boolean;
  uploadProgress: Record<string, number>;
  error: string | null;

  // Actions
  uploadPrescription: (file: File, productId: string, options?: PrescriptionUploadOptions) => Promise<void>;
  removePrescription: (uploadId: string) => Promise<void>;
  loadPrescriptionsForProduct: (productId: string) => Promise<void>;
  clearError: () => void;
  hasPrescriptionForProduct: (productId: string) => boolean;
  getPrescriptionsForProduct: (productId: string) => PrescriptionFile[];
}

export const usePrescriptionUpload = create<PrescriptionUploadState>()(
  persist(
    (set, get) => ({
      // Initial state
      uploadedFiles: [],
      isUploading: false,
      uploadProgress: {},
      error: null,

      uploadPrescription: async (file: File, productId: string, options?: PrescriptionUploadOptions) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error('Please sign in to upload prescriptions');
          return;
        }

        set({ isUploading: true, error: null });

        try {
          // Create a temporary upload ID for progress tracking
          const tempUploadId = `temp-${Date.now()}`;

          // Set initial progress
          set(state => ({
            uploadProgress: { ...state.uploadProgress, [tempUploadId]: 0 }
          }));

          // Simulate progress updates (since Supabase doesn't provide progress callbacks)
          const progressInterval = setInterval(() => {
            const currentProgress = get().uploadProgress[tempUploadId] || 0;
            if (currentProgress < 90) {
              set(state => ({
                uploadProgress: {
                  ...state.uploadProgress,
                  [tempUploadId]: currentProgress + 10
                }
              }));
            }
          }, 100);

          // Upload the prescription
          const uploadedFile = await prescriptionService.uploadPrescriptionFile(
            file,
            user.id,
            productId,
            options
          );

          // Clear progress and complete upload
          clearInterval(progressInterval);

          // Update state with uploaded file
          set(state => ({
            uploadedFiles: [...state.uploadedFiles, uploadedFile],
            uploadProgress: { ...state.uploadProgress, [tempUploadId]: 100 },
            isUploading: false,
          }));

          // Clear progress after a short delay
          setTimeout(() => {
            set(state => {
              const newProgress = { ...state.uploadProgress };
              delete newProgress[tempUploadId];
              return { uploadProgress: newProgress };
            });
          }, 500);

          toast.success('Prescription uploaded successfully');

        } catch (error: any) {
          console.error('Prescription upload error:', error);
          set({
            isUploading: false,
            error: error.message || 'Failed to upload prescription'
          });

          // Clear any remaining progress
          set(state => {
            const newProgress = { ...state.uploadProgress };
            Object.keys(newProgress).forEach(key => {
              if (key.startsWith('temp-')) {
                delete newProgress[key];
              }
            });
            return { uploadProgress: newProgress };
          });

          toast.error(error.message || 'Failed to upload prescription');
        }
      },

      removePrescription: async (uploadId: string) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          toast.error('Please sign in to manage prescriptions');
          return;
        }

        try {
          await prescriptionService.deletePrescriptionFile(uploadId, user.id);

          // Remove from local state
          set(state => ({
            uploadedFiles: state.uploadedFiles.filter(file => file.id !== uploadId)
          }));

          toast.success('Prescription removed successfully');

        } catch (error: any) {
          console.error('Prescription removal error:', error);
          toast.error(error.message || 'Failed to remove prescription');
        }
      },

      loadPrescriptionsForProduct: async (productId: string) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          set({ uploadedFiles: [] });
          return;
        }

        try {
          const prescriptions = await prescriptionService.getPrescriptionsForProduct(user.id, productId);

          // Filter to only show prescriptions for this product and update state
          set(state => ({
            uploadedFiles: [
              ...state.uploadedFiles.filter(file => file.product_id !== productId),
              ...prescriptions
            ]
          }));

        } catch (error: any) {
          console.error('Failed to load prescriptions:', error);
          toast.error('Failed to load prescriptions');
        }
      },

      clearError: () => {
        set({ error: null });
      },

      hasPrescriptionForProduct: (productId: string) => {
        return get().uploadedFiles.some(file => file.product_id === productId);
      },

      getPrescriptionsForProduct: (productId: string) => {
        return get().uploadedFiles.filter(file => file.product_id === productId);
      },
    }),
    {
      name: 'prescription-uploads',
      // Only persist the uploaded files, not the loading states
      partialize: (state) => ({ uploadedFiles: state.uploadedFiles }),
    }
  )
);