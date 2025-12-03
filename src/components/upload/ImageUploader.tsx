'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { UploadCloud, X, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { detectProductFromImage } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ImageUploader() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e);
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    startTransition(async () => {
      const result = await detectProductFromImage(null, formData);

      if (result.status === 'success' && result.productName) {
        toast({
          title: 'Product Detected!',
          description: `We found a "${result.productName}". Now finding prices...`,
        });
        router.push(`/compare?q=${encodeURIComponent(result.productName)}`);
      } else if (result.status === 'error') {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: result.message,
        });
      }
    });
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            {!imagePreview ? (
              <label
                htmlFor="image-upload"
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors",
                  isDragging && "border-primary bg-secondary"
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragEvents}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP (MAX. 5MB)</p>
                </div>
                <input
                  id="image-upload"
                  name="image-input"
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="contain" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {file && (
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Detect Product
                </>
              )}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
