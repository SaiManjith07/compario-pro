import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/PageHeader';
import { searchPrices } from '@/lib/actions';
import CompareClient from '@/components/compare/CompareClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function CompareFallback() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

// This component fetches data on the server based on the search param
async function CompareData({ productName }: { productName: string }) {
  // We only fetch initial data if a product name is present
  const initialData = productName ? await searchPrices(productName) : null;
  return (
    <CompareClient
      initialData={initialData}
      initialSearchTerm={productName}
    />
  );
}

// The page now correctly receives searchParams and passes the query down
export default function ComparePage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const productName = searchParams?.q || '';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Compare Prices"
        description="Search for a product by name to see prices from different stores."
      />

      <Suspense fallback={<CompareFallback />}>
        <CompareData productName={productName} />
      </Suspense>

      {!productName && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Searches</CardTitle>
            <CardDescription>
              Or try one of these popular products to see how it works.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {PlaceHolderImages.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/compare?q=${encodeURIComponent(item.imageHint)}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-lg">
                    <Image
                      src={item.imageUrl}
                      alt={item.description}
                      width={400}
                      height={300}
                      className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={item.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4">
                      <h3 className="font-bold text-white capitalize">
                        {item.imageHint}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
