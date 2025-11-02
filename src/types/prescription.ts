export interface PrescriptionFile {
  id: string;
  user_id: string;
  product_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  upload_status: 'uploaded' | 'pending' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface PrescriptionUploadOptions {
  maxSize?: number; // bytes
  allowedTypes?: string[];
  autoRemove?: boolean; // remove on component unmount
}

export interface PrescriptionUploadState {
  files: PrescriptionFile[];
  uploading: boolean;
  error: string | null;
  progress: Record<string, number>;
}

export interface PrescriptionValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: string;
  fileSize?: number;
}

export interface PrescriptionPreviewData {
  url: string;
  type: 'image' | 'pdf';
  thumbnail?: string;
}

// Default upload options
export const DEFAULT_PRESCRIPTION_OPTIONS: PrescriptionUploadOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  autoRemove: false,
};

// File type validation
export const PRESCRIPTION_FILE_TYPES = {
  JPEG: 'image/jpeg',
  JPG: 'image/jpg',
  PNG: 'image/png',
  PDF: 'application/pdf',
} as const;

// Helper function to check if file is a valid prescription type
export const isValidPrescriptionFileType = (file: File): boolean => {
  return Object.values(PRESCRIPTION_FILE_TYPES).includes(file.type as any);
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to generate unique file name
export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${random}.${extension}`;
};