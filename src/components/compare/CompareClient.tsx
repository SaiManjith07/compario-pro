'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSearchHistory } from '@/hooks/use-search-history';
import { searchPrices } from '@/lib/actions';
import { ComparisonData } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { PriceCard } from './PriceCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

export default function CompareClient({
  initialData,
  initialSearchTerm,
}: {
  initialData: ComparisonData | null;
  initialSearchTerm: string;
}) {
  const [data, setData] = useState<ComparisonData | null>(initialData);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isPending, startTransition] = useTransition();
  const { addHistoryEntry } = useSearchHistory();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Effect to update state when initialData from server changes
  useEffect(() => {
    // Check if the search param from the URL matches the current search term
    const q = searchParams.get('q');
    if (q && q !== searchTerm) {
      setSearchTerm(q);
    }

    if (initialData) {
      setData(initialData);
      if (initialData.bestPrice) {
        addHistoryEntry({
          productName: initialData.productName,
          bestPrice: initialData.bestPrice.price,
          store: initialData.bestPrice.store,
        });
      }
    }
  }, [initialData, searchParams, addHistoryEntry, searchTerm]);
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchTerm) return;

    // Update the URL, which will trigger a re-render with new server-fetched data
    router.push(`/compare?q=${encodeURIComponent(searchTerm)}`);

    // We can also optimistically fetch on the client, but the primary mechanism is server-side
    startTransition(async () => {
      const result = await searchPrices(searchTerm);
      setData(result);
      if (result.bestPrice) {
        addHistoryEntry({
          productName: result.productName,
          bestPrice: result.bestPrice.price,
          store: result.bestPrice.store,
        });
      }
    });
  };

  const chartConfig = {
    price: {
      label: 'Price (₹)',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="search"
          placeholder="Enter product name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button type="submit" disabled={isPending || !searchTerm}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Search
        </Button>
      </form>

      {isPending && (
        <div className="space-y-6">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-center text-muted-foreground">Finding the best deals for you...</p>
        </div>
      )}

      {!isPending && data && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>AI Summary for &quot;{data.productName}&quot;</CardTitle>
              <CardDescription>Our AI has analyzed the results to give you a quick summary.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{data.summary}</p>
            </CardContent>
          </Card>

          {data.results.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Price Comparison Chart</CardTitle>
                  <CardDescription>
                    A visual breakdown of prices for &quot;{data.productName}&quot; across different stores.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <AreaChart accessibilityLayer data={data.results} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                       <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="store"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 10)}
                      />
                      <YAxis
                        tickFormatter={(value) => `₹${value}`}
                        width={80}
                      />
                      <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                      <Area dataKey="price" type="monotone" fill="var(--color-price)" fillOpacity={0.4} stroke="var(--color-price)" />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.results.map((result, index) => (
                  <PriceCard
                    key={`${result.store}-${index}`}
                    result={result}
                    isBestPrice={result === data.bestPrice}
                  />
                ))}
              </div>
            </>
          ) : (
            <Alert>
              <Search className="h-4 w-4" />
              <AlertTitle>No Results Found</AlertTitle>
              <AlertDescription>
                We couldn&apos;t find any prices for &quot;{data.productName}&quot;. Try a different search term.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      {!isPending && !data && initialSearchTerm && (
         <Alert>
           <Search className="h-4 w-4" />
           <AlertTitle>No Data</AlertTitle>
           <AlertDescription>
             Start a search to see price comparisons.
           </AlertDescription>
         </Alert>
      )}

    </div>
  );
}
