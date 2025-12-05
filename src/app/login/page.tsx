import { SignIn } from '@/components/auth/SignIn';
import { AppLogo } from '@/components/AppLogo';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <AppLogo />
        </div>
        <SignIn />
      </div>
    </div>
  );
}
