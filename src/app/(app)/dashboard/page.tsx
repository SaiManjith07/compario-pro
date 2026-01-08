'use client';

import { useSearchHistory } from '@/hooks/use-search-history';
import { PageHeader } from '@/components/PageHeader';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart,
  GitCompareArrows,
  History,
  UploadCloud,
  TrendingUp,
  Landmark,
  Clock,
  Box,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Bar as RechartsBar,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

const StatCard = ({
  title,
  value,
  icon: Icon,
  isLoading,
  className,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading: boolean;
  className?: string;
}) => (
  <Card
    className={cn(
      'relative overflow-hidden transition-transform hover:scale-[1.02]',
      className
    )}
  >
    <div className="absolute -right-4 -top-4 size-20 rounded-full bg-primary/10 opacity-50" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="size-5 text-primary" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="mt-1 h-8 w-24" />
      ) : (
        <div className="truncate text-2xl font-bold" title={String(value)}>
          {value}
        </div>
      )}
    </CardContent>
  </Card>
);

export default function DashboardPage() {
  const { history, isLoaded } = useSearchHistory();
  const { user } = useUser();
  const latestSearch = history[0];

  const chartConfig = {
    bestPrice: {
      label: 'Best Price (₹)',
      color: 'hsl(var(--chart-1))',
    },
  };

  const chartData = history
    .slice(0, 5)
    .reverse()
    .map((item) => ({
      name: item.productName,
      bestPrice: item.bestPrice,
    }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Welcome back, ${user?.displayName?.split(' ')[0] || 'User'}!`}
        description="Here's a summary of your recent price-hunting activity."
      />

      <section>
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/upload" className="group block">
            <Card className="flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/20 to-card transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/80 p-3 text-primary-foreground transition-transform group-hover:scale-110">
                    <UploadCloud />
                  </div>
                  <div>
                    <CardTitle>Upload an Image</CardTitle>
                    <CardDescription className="mt-1">
                      Let AI identify your product.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground transition-transform group-hover:translate-x-1">
                  Start your search by uploading a picture &rarr;
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/compare" className="group block">
            <Card className="flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/20 to-card transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/80 p-3 text-primary-foreground transition-transform group-hover:scale-110">
                    <GitCompareArrows />
                  </div>
                  <div>
                    <CardTitle>Compare by Name</CardTitle>
                    <CardDescription className="mt-1">
                      Know the product? Search now.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground transition-transform group-hover:translate-x-1">
                  Find the best prices instantly &rarr;
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-headline text-xl font-semibold">
          Your Latest Find
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Last Product Searched"
            value={latestSearch?.productName || 'N/A'}
            icon={Box}
            isLoading={!isLoaded}
          />
          <StatCard
            title="Best Price Found"
            value={
              latestSearch ? `₹${latestSearch.bestPrice.toFixed(2)}` : 'N/A'
            }
            icon={TrendingUp}
            isLoading={!isLoaded}
          />
          <StatCard
            title="Cheapest Store"
            value={latestSearch?.store || 'N/A'}
            icon={Landmark}
            isLoading={!isLoaded}
          />
          <StatCard
            title="Last Search Time"
            value={
              latestSearch
                ? formatDistanceToNow(new Date(latestSearch.timestamp), {
                    addSuffix: true,
                  })
                : 'N/A'
            }
            icon={Clock}
            isLoading={!isLoaded}
          />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent History</CardTitle>
            <CardDescription>Your last 3 unique searches.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoaded ? (
              history.length > 0 ? (
                <ul className="space-y-4">
                  {history.slice(0, 3).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="truncate" title={item.productName}>
                        {item.productName}
                      </span>
                      <span className="whitespace-nowrap font-semibold text-primary">
                        ₹{item.bestPrice.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground">
                  No search history yet.
                </p>
              )
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/5" />
              </div>
            )}
            <Button
              variant="link"
              asChild
              className="px-0 pt-4 text-primary"
            >
              <Link href="/history">
                View all history <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Price Trends</CardTitle>
            <CardDescription>
              Best prices found in your last 5 searches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoaded && history.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="h-[240px] w-full"
              >
                <RechartsBarChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value.slice(0, 10) + (value.length > 10 ? '...' : '')
                    }
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                    width={80}
                  />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <RechartsBar
                    dataKey="bestPrice"
                    fill="var(--color-bestPrice)"
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[240px] items-center justify-center">
                <p className="text-center text-muted-foreground">
                  {isLoaded
                    ? 'No search data available for trend analysis.'
                    : 'Loading chart...'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
