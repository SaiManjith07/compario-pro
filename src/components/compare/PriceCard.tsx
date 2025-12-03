import Image from 'next/image';
import Link from 'next/link';
import { PriceResult } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceCardProps {
  result: PriceResult;
  isBestPrice: boolean;
}

export function PriceCard({ result, isBestPrice }: PriceCardProps) {
  const StoreLogo = () => {
    return (
      <div className="flex items-center justify-center h-8 w-16 rounded-md bg-muted text-muted-foreground text-sm font-bold">
        {result.store}
      </div>
    );
  };

  return (
    <Card className={cn("flex flex-col transition-all", isBestPrice && "border-primary ring-2 ring-primary")}>
      <CardHeader className="relative">
        <div className="aspect-[4/3] relative w-full overflow-hidden rounded-md bg-muted">
          <Image
            src={result.image}
            alt={result.title}
            fill
            className="object-cover"
            data-ai-hint="product image"
          />
        </div>
        {isBestPrice && (
          <Badge className="absolute top-5 right-5">Best Price</Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <StoreLogo />
        <p className="font-semibold text-foreground line-clamp-2 h-[40px]">{result.title}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-2xl font-bold font-headline text-primary">₹{result.price.toFixed(2)}</p>
        <Button asChild>
          <Link href={result.url} target="_blank" rel="noopener noreferrer">
            Shop
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
