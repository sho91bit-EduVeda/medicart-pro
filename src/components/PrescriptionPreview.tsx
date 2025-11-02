import { useState } from 'react';
import { Check, Download, Eye, FileText, Image, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { PrescriptionFile, formatFileSize } from '@/types/prescription';
import { prescriptionService } from '@/services/prescriptionService';
import { toast } from 'sonner';

interface PrescriptionPreviewProps {
  prescriptionFile: PrescriptionFile;
  onView?: () => void;
  onRemove: () => void;
  onReplace?: (file: File) => void;
  showActions?: boolean;
  className?: string;
}

export function PrescriptionPreview({
  prescriptionFile,
  onView,
  onRemove,
  onReplace,
  showActions = true,
  className
}: PrescriptionPreviewProps) {
  const [isViewing, setIsViewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const isImage = prescriptionFile.file_type.startsWith('image/');
  const isPdf = prescriptionFile.file_type === 'application/pdf';

  const handleView = async () => {
    if (onView) {
      onView();
      return;
    }

    setIsLoading(true);
    try {
      const url = await prescriptionService.getPrescriptionUrl(prescriptionFile.file_path);
      setPreviewUrl(url);
      setIsViewing(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load prescription preview';
      toast.error(errorMessage);
      console.error('Error loading prescription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const url = await prescriptionService.getPrescriptionUrl(prescriptionFile.file_path);
      const link = document.createElement('a');
      link.href = url;
      link.download = prescriptionFile.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      toast.error('Failed to download prescription');
      console.error('Error downloading prescription:', error);
    }
  };

  const handleRemove = () => {
    onRemove();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* File icon/thumbnail */}
            <div className="flex-shrink-0">
              {isImage ? (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Image className="w-6 h-6 text-gray-600" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {prescriptionFile.file_name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(prescriptionFile.file_size)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(prescriptionFile.created_at)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {isImage ? 'Image' : 'PDF'}
                    </Badge>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Uploaded</span>
                </div>
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleView}
                    disabled={isLoading}
                    className="h-8 px-2"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    {isLoading ? 'Loading...' : 'View'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 px-2"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>

                  {onReplace && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*,.pdf';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) onReplace(file);
                        };
                        input.click();
                      }}
                      className="h-8 px-2"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Replace
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={isViewing} onOpenChange={setIsViewing}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {prescriptionFile.file_name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsViewing(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {isImage ? (
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt={prescriptionFile.file_name}
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxHeight: '70vh' }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-medium">PDF Document</h3>
                  <p className="text-sm text-gray-500">
                    {prescriptionFile.file_name} • {formatFileSize(prescriptionFile.file_size)}
                  </p>
                  <Button onClick={handleDownload} className="mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}