import { Suspense } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { searchPrices } from '@/lib/actions';
import CompareClient from '@/components/compare/CompareClient';
import { Skeleton } from '@/components/ui/skeleton';

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
      {/* Suspense is key for streaming the server-rendered result */}
      <Suspense fallback={<CompareFallback />}>
        <CompareData productName={productName} />
      </Suspense>
    </div>
  );
}
