'use client';

import { useRouter } from 'next/navigation';
import { useSearchHistory } from '@/hooks/use-search-history';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { History, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export default function HistoryClient() {
  const { history, isLoaded } = useSearchHistory();
  const router = useRouter();

  const handleSearchAgain = (productName: string) => {
    router.push(`/compare?q=${encodeURIComponent(productName)}`);
  };

  if (!isLoaded) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="hidden md:table-cell">Best Price</TableHead>
              <TableHead className="hidden lg:table-cell">Store</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (history.length === 0) {
    return (
        <Alert className="max-w-md mx-auto">
            <History className="h-4 w-4" />
            <AlertTitle>No History Found</AlertTitle>
            <AlertDescription>
            Your search history is empty. Start by comparing prices for a product.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="hidden md:table-cell">Best Price</TableHead>
            <TableHead className="hidden lg:table-cell">Store</TableHead>
            <TableHead className="hidden lg:table-cell">Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.productName}</TableCell>
              <TableCell className="hidden md:table-cell">${item.bestPrice.toFixed(2)}</TableCell>
              <TableCell className="hidden lg:table-cell">{item.store}</TableCell>
              <TableCell className="hidden lg:table-cell">
                {format(new Date(item.timestamp), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearchAgain(item.productName)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search Again
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
