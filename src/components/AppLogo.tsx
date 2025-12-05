import { Tags } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Tags className="h-5 w-5" />
      </div>
      <h1 className="text-xl font-headline font-bold text-primary">Compario</h1>
    </div>
  );
}
