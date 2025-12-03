'use client';

import { useSearchHistory } from '@/hooks/use-search-history';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BarChart as BarChartIcon, GitCompareArrows, History, UploadCloud } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

export default function DashboardPage() {
  const { history, isLoaded } = useSearchHistory();
  const latestSearch = history[0];

  const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string; value: string | number; icon: React.ElementType; isLoading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
  
  const chartConfig = {
    bestPrice: {
      label: 'Best Price (₹)',
      color: 'hsl(var(--primary))',
    },
  };
  
  const chartData = history.slice(0, 5).reverse().map(item => ({
    name: item.productName,
    bestPrice: item.bestPrice
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's a summary of your recent activity."
      />

      <section>
        <h2 className="text-xl font-headline font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="hover:bg-card/90 transition-colors">
            <Link href="/upload" className="block h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadCloud className="text-primary" />
                  Upload an Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Let AI identify your product and find the best prices.</p>
              </CardContent>
            </Link>
          </Card>
          <Card className="hover:bg-card/90 transition-colors">
            <Link href="/compare" className="block h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompareArrows className="text-primary" />
                  Compare by Name
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Already know the product? Start comparing prices now.</p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-headline font-semibold mb-4">Latest Search Summary</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Last Product Searched"
            value={latestSearch?.productName || 'N/A'}
            icon={GitCompareArrows}
            isLoading={!isLoaded}
          />
          <StatCard
            title="Best Price Found"
            value={latestSearch ? `₹${latestSearch.bestPrice.toFixed(2)}` : 'N/A'}
            icon={BarChartIcon}
            isLoading={!isLoaded}
          />
          <StatCard
            title="Cheapest Store"
            value={latestSearch?.store || 'N/A'}
            icon={BarChartIcon}
            isLoading={!isLoaded}
          />
          <StatCard
            title="Last Search Time"
            value={latestSearch ? formatDistanceToNow(new Date(latestSearch.timestamp), { addSuffix: true }) : 'N/A'}
            icon={History}
            isLoading={!isLoaded}
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoaded ? (
              history.length > 0 ? (
                <ul className="space-y-2">
                  {history.slice(0, 3).map(item => (
                    <li key={item.id} className="flex justify-between items-center">
                      <span>{item.productName}</span>
                      <span className="font-semibold">₹{item.bestPrice.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No search history yet.</p>
              )
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/5" />
              </div>
            )}
            <Button variant="link" asChild className="p-0 mt-4">
              <Link href="/history">View all history <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Search Trends</CardTitle>
            <CardDescription>Best prices found in your last 5 searches.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoaded && history.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 10) + (value.length > 10 ? '...' : '')}
                  />
                   <YAxis
                        tickFormatter={(value) => `₹${value}`}
                        width={80}
                      />
                  <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Line type="monotone" dataKey="bestPrice" stroke="var(--color-bestPrice)" strokeWidth={2} dot={{
                    fill: "var(--color-bestPrice)",
                    r: 4
                  }} />
                </LineChart>
              </ChartContainer>
            ) : (
                <div className="flex items-center justify-center h-full min-h-[150px]">
                    <p className="text-muted-foreground text-center">
                        {isLoaded ? "No search data available for trend analysis." : "Loading chart..."}
                    </p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
