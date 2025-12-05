import { PageHeader } from '@/components/PageHeader';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, ScanSearch, HandCoins } from 'lucide-react';

const steps = [
  {
    icon: FileUp,
    title: 'Upload Your Image',
    description: 'Drag and drop or click to upload a clear picture of the product you want to find.',
  },
  {
    icon: ScanSearch,
    title: 'AI Product Detection',
    description: 'Our powerful AI analyzes the image to accurately identify the product and its specific model.',
  },
  {
    icon: HandCoins,
    title: 'Compare Best Prices',
    description: 'We instantly search multiple online stores to find the best available prices for you.',
  },
]

export default function UploadPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Upload an Image"
        description="Got a picture of what you want? Let our AI find it and compare prices for you in seconds."
      />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3">
          <ImageUploader />
        </div>
        <div className="md:col-span-2">
           <Card className="h-full">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-6">
                {steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
