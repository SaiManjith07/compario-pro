import { PageHeader } from '@/components/PageHeader';
import HistoryClient from '@/components/history/HistoryClient';
import { Suspense } from 'react';

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Search History"
        description="Here are your most recent price comparisons."
      />
      <Suspense fallback={<div>Loading history...</div>}>
        <HistoryClient />
      </Suspense>
    </div>
  );
}
