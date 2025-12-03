import { PageHeader } from '@/components/PageHeader';
import CsvUploader from '@/components/settings/CsvUploader';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your application settings and preferences."
      />
      <CsvUploader />
    </div>
  );
}
