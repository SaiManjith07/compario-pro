import { PageHeader } from '@/components/PageHeader';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />
      <Card className="max-w-2xl">
        <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your password and account security.</CardDescription>
        </CardHeader>
        <CardContent>
            <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
