import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import Link from "next/link";

export default function QueuePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center relative overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute w-200 h-200 bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />

      <div className="z-10 flex flex-col items-center space-y-8 glass-panel p-16 rounded-2xl border border-white/5 ring-1 ring-primary/20 shadow-2xl">
        <div className="relative">
          <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-20" />
          <Swords className="w-24 h-24 text-primary animate-bounce pt-2" />
        </div>

        <h1 className="text-4xl font-black uppercase tracking-widest text-foreground">
          In Matchmaking Queue
        </h1>
        <p className="text-muted-foreground text-lg animate-pulse">
          Searching for opponent... Time Elapsed: 0:14
        </p>

        <Link href="/">
          <Button
            variant="outline"
            className="mt-8 border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-colors duration-300 px-8 py-6 uppercase font-bold tracking-wider"
          >
            Cancel Queue
          </Button>
        </Link>
      </div>
    </div>
  );
}
