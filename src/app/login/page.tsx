import { SignIn } from '@/components/auth/SignIn';
import { AppLogo } from '@/components/AppLogo';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function LoginPageFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <AppLogo />
        </div>
        <Suspense fallback={<LoginPageFallback />}>
          <SignIn />
        </Suspense>
      </div>
    </div>
  );
}
