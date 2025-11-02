import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileImage, FileText, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { usePrescriptionUpload } from '@/hooks/usePrescriptionUpload';
import { PrescriptionUploadOptions } from '@/types/prescription';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PrescriptionUploadProps {
  productId: string;
  onUploadSuccess?: (fileData: any) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  options?: PrescriptionUploadOptions;
}

export function PrescriptionUpload({
  productId,
  onUploadSuccess,
  onUploadError,
  disabled = false,
  className,
  options = {}
}: PrescriptionUploadProps) {
  const {
    uploadPrescription,
    isUploading,
    uploadProgress,
    error,
    clearError
  } = usePrescriptionUpload();

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Basic file validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, or PDF files only.');
      return;
    }

    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    clearError();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      await uploadPrescription(selectedFile, productId, options);
      setSelectedFile(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess?.(selectedFile);
    } catch (error: any) {
      onUploadError?.(error.message);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    clearError();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-8 h-8 text-green-600" />;
    }
    return <FileText className="w-8 h-8 text-blue-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadProgress = () => {
    // Find the progress for the current upload
    const progressEntries = Object.entries(uploadProgress);
    if (progressEntries.length === 0) return 0;

    // Get the most recent progress entry
    const latestProgress = progressEntries[progressEntries.length - 1]?.[1] || 0;
    return latestProgress;
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Upload Area */}
          {!selectedFile ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-gray-300 hover:border-gray-400",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">
                    Upload Prescription
                  </h3>
                  <p className="text-sm text-gray-500">
                    Drag and drop your prescription file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-400">
                    Supported formats: JPG, PNG, PDF (Max 5MB)
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  disabled={disabled || isUploading}
                  className="hidden"
                />

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>
          ) : (
            /* Selected File Preview */
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                {getFileIcon(selectedFile)}

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(getUploadProgress())}%</span>
                  </div>
                  <Progress value={getUploadProgress()} className="h-2" />
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading || disabled}
                className="w-full"
              >
                {isUploading ? (
                  'Uploading...'
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Prescription
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Ensure your prescription is clear and readable</p>
            <p>• The prescription must be from a licensed medical practitioner</p>
            <p>• Your prescription will be verified before order confirmation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}