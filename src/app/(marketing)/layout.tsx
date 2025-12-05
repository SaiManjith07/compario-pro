import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <AppLogo />
          <nav>
            <Button asChild>
              <Link href="/login">Account Login</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="container flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Compario. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
