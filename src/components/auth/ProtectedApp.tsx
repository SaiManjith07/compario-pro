'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function ProtectedApp({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If the user data is still loading, we don't do anything yet.
    if (isUserLoading) {
      return;
    }

    // If the user is not logged in, redirect them to the login page.
    // We also append the current path as a redirect_to query parameter.
    if (!user) {
      const loginUrl = new URL('/login', window.location.origin);
      loginUrl.searchParams.set('redirect_to', pathname);
      router.replace(loginUrl.toString());
    }
  }, [user, isUserLoading, router, pathname]);

  // While the user state is loading, we show a full-screen loader.
  // This prevents a flash of the login page or the protected content.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If there's a user, they are authenticated, so we can render the app.
  if (user) {
    return <>{children}</>;
  }

  // If there is no user and we are not loading, the useEffect will have already
  // initiated a redirect. We return null to prevent rendering anything
  // while the redirect is in progress.
  return null;
}
