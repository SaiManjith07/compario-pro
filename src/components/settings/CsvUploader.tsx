'use client';

import { useState, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { UploadCloud, X, Loader2, Table, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processCsv } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const initialState = {
  status: 'idle',
  message: '',
  results: [],
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Table className="mr-2 h-4 w-4" />
          Process CSV
        </>
      )}
    </Button>
  );
}

export default function CsvUploader() {
  const [state, formAction] = useActionState(processCsv, initialState);
  const { toast } = useToast();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === 'success' && state.results.length > 0) {
      toast({
        title: 'CSV Processed!',
        description: `Compared prices for ${state.results.length} products.`,
      });
      // Potentially redirect or display results
    } else if (state.status === 'error') {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: state.message,
      });
    }
  }, [state, router, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName(null);
    const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Bulk Upload</CardTitle>
                <CardDescription>
                Upload a CSV file of products to compare prices in bulk. The CSV should have a header row with a 'ProductName' column.
                </CardDescription>
            </div>
            <Button variant="outline" asChild>
                <a href="/products.csv" download>
                    <Download className="mr-2 h-4 w-4" />
                    Download Sample
                </a>
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            {!file ? (
              <label
                htmlFor="csv-upload"
                className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-secondary transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV (MAX. 5MB)</p>
                </div>
                <input
                  id="csv-upload"
                  name="csv"
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="relative w-full h-48 flex items-center justify-center rounded-lg overflow-hidden border bg-secondary/50">
                <div className="text-center">
                    <Table className="w-16 h-16 mx-auto text-muted-foreground" />
                    <p className="font-semibold">{fileName}</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {file && <SubmitButton />}
        </form>
        {state.status === 'success' && state.results.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Comparison Results</h3>
            <div className="rounded-lg border mt-2">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Best Price</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Store</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {state.results.map((result, index) => (
                      <tr key={index} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-medium">{result.productName}</td>
                        <td className="p-4 align-middle">${result.bestPrice?.price.toFixed(2)}</td>
                        <td className="p-4 align-middle">{result.bestPrice?.store}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}