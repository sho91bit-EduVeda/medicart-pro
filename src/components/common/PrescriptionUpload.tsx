import { useState } from "react";
import { auth, db, storage } from "@/integrations/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface PrescriptionUploadProps {
  orderId?: string;
  onUploadComplete?: (fileUrl: string) => void;
}

export function PrescriptionUpload({ orderId, onUploadComplete }: PrescriptionUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a valid file (JPEG, PNG, or PDF)';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error('You must be logged in to upload prescriptions');
      }

      // Generate unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.uid}-${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `prescriptions/${fileName}`);

      // Upload file to Firebase Storage
      await uploadBytes(storageRef, selectedFile);

      // Get download URL
      const publicUrl = await getDownloadURL(storageRef);

      // Save prescription record to database
      await addDoc(collection(db, 'prescriptions'), {
        user_id: user.uid,
        order_id: orderId || null,
        file_url: publicUrl,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        status: 'pending',
        created_at: new Date().toISOString()
      });

      setUploadedUrl(publicUrl);
      toast.success('Prescription uploaded successfully');

      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload prescription';
      setError(errorMessage);
      toast.error('Failed to upload prescription');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setError(null);
    setUploadedUrl(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Upload Prescription
        </CardTitle>
        <CardDescription>
          Required for prescription medicines. Accepted formats: JPEG, PNG, PDF (Max 5MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadedUrl ? (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-green-800">Prescription uploaded successfully!</span>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                <X className="w-4 h-4" />
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="prescription">Select Prescription File</Label>
              <Input
                id="prescription"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <div>
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={clearSelection} disabled={uploading}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Prescription
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
