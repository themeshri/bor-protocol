import { Sparkles } from 'lucide-react';

export default function ComingSoonScene() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-background text-foreground">
      <div className="animate-fade-in flex flex-col items-center space-y-6 p-8 text-center">
        <div className="relative">
          <Sparkles className="w-16 h-16 text-primary animate-pulse" />
        </div>
        <h2 className="text-4xl font-bold tracking-tight">More Coming Soon!</h2>
        <p className="text-lg text-muted-foreground max-w-md">
          Stay tuned for more amazing 3D experiences and interactive content.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>New scenes being crafted</span>
        </div>
      </div>
    </div>
  );
}