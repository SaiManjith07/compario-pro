import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle,
  ScanSearch,
  UploadCloud,
  History,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
      <section className="py-20 sm:py-32">
        <div className="container px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Find the Best Price,{' '}
            <span className="bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
              Every Single Time.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Stop switching between tabs. PriceWise uses AI to instantly compare prices from multiple online stores, ensuring you never overpay again.
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
      <section className="py-16 sm:py-24">
        <div className="container px-4">
           <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                   {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Showcase Section */}
      <section className="bg-muted py-20 sm:py-32">
        <div className="container px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your Smart Shopping Dashboard
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A clear, intuitive interface that puts all the power at your fingertips.
            </p>
          </div>
          <div className="mt-10">
            <Card className="overflow-hidden bg-background shadow-2xl">
              <CardContent className="p-0">
                <Image
                  src="https://images.unsplash.com/photo-1699694518322-a18a514a6b24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxzaG9wcGluZyUyMGRhc2hib2FyZHxlbnwwfHx8fDE3NjQ4MzU1MDl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="PriceWise Dashboard Screenshot"
                  width={1200}
                  height={750}
                  className="w-full"
                  data-ai-hint="shopping dashboard"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

    </div>
  );
}
