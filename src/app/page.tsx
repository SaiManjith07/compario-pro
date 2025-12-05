import { Button } from '@/components/ui/button';
import {
  ScanSearch,
  UploadCloud,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: <UploadCloud className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Image Search',
    description: 'Just upload a picture of a product, and our AI will identify it for you instantly.',
  },
  {
    icon: <ScanSearch className="h-8 w-8 text-primary" />,
    title: 'Comprehensive Price Comparison',
    description: 'We search across multiple online stores to find the absolute best price for your desired item.',
  },
  {
    icon: <History className="h-8 w-8 text-primary" />,
    title: 'Search History',
    description: 'Keep track of all your searches to revisit deals and monitor price changes over time.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
         <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"
        />
        <div className="container relative px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Find the Best Price,{' '}
            <span className="bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
              Every Single Time.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Stop switching between tabs. Compario uses AI to instantly compare prices from multiple online stores, ensuring you never overpay again.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/login">Get Started for Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
               <Link href="/compare">Try a Live Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature List Section */}
      <section className="py-20 sm:py-32">
        <div className="container px-4">
           <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="flex transform flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl">
                <CardHeader className="items-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                     {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
