import { PageHeader } from '@/components/PageHeader';
import { ImageUploader } from '@/components/upload/ImageUploader';

export default function UploadPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Upload Image"
        description="Upload a picture of a product. Our AI will identify it and find the best prices for you."
      />
      <ImageUploader />
    </div>
  );
}
