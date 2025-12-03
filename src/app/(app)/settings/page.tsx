import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your application settings and preferences."
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload</CardTitle>
          <CardDescription>
            Upload a CSV file of products to compare prices in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div
                className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg bg-card"
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">CSV upload will be supported in future versions.</span>
                    </p>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
