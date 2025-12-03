import Image from 'next/image';
import Link from 'next/link';
import { PriceResult } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceCardProps {
  result: PriceResult;
  isBestPrice: boolean;
}

const storeLogos: { [key: string]: { src: string; width: number; height: number } } = {
  Amazon: { src: 'https://logo.clearbit.com/amazon.com', width: 64, height: 32 },
  eBay: { src: 'https://logo.clearbit.com/ebay.com', width: 64, height: 32 },
  Walmart: { src: 'https://logo.clearbit.com/walmart.com', width: 64, height: 32 },
  'Best Buy': { src: 'https://logo.clearbit.com/bestbuy.com', width: 64, height: 32 },
  Target: { src: 'https://logo.clearbit.com/target.com', width: 64, height: 32 },
};


export function PriceCard({ result, isBestPrice }: PriceCardProps) {
  const StoreLogo = () => {
    const logo = storeLogos[result.store];
    if (logo) {
      return (
        <div className="flex items-center gap-2">
          <Image
            src={logo.src}
            alt={`${result.store} logo`}
            width={logo.width}
            height={logo.height}
            className="h-8 w-auto object-contain"
          />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-8 w-16 rounded-md bg-muted text-muted-foreground text-sm font-bold">
        {result.store}
      </div>
    );
  };

  return (
    <Card className={cn("flex flex-col transition-all", isBestPrice && "border-primary ring-2 ring-primary")}>
      <CardHeader className="relative">
        {isBestPrice && (
          <Badge className="absolute top-2 right-2">Best Price</Badge>
        )}
        <StoreLogo />
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
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
