'use client';

import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function SignIn() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Welcome to PriceWise</CardTitle>
        <CardDescription>Sign in to continue to your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={handleSignIn} disabled={isUserLoading}>
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 261.8 0 122.4 109.8 13.6 244 13.6c70.3 0 129.8 27.8 175.3 73.6L363.5 150c-29.2-28.1-68.9-45.3-119.5-45.3-95.8 0-173.4 77.3-173.4 172.3s77.6 172.3 173.4 172.3c62.7 0 101-25.2 133-55.9 25.4-24.6 39-57.6 44.7-99.1H244V259.9h239.8c2.6 14.1 4.2 29.2 4.2 45.9z"></path>
          </svg>
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}
