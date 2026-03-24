"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import Link from "next/link";
import { useMatchStore } from "@/store/matchStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function QueuePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { joinQueue, leaveQueue } = useMatchStore();

  const [isQueuing, setIsQueuing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isQueuing) return;

    joinQueue("");
    setElapsed(0);

    const elapsedInterval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    // Poll queue/status every 2s to detect when we've been matched
    const poll = setInterval(async () => {
      try {
        const { apiFetch } = await import("@/service/api");
        const data = await apiFetch<{ status: string; match_id?: string }>(
          "/api/queue/status"
        );
        if (data.status === "matched" && data.match_id) {
          clearInterval(poll);
          clearInterval(elapsedInterval);
          router.push(`/match/${data.match_id}`);
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => {
      clearInterval(elapsedInterval);
      clearInterval(poll);
      leaveQueue("");
    };
  }, [joinQueue, leaveQueue, router, isQueuing]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background items-center justify-center relative overflow-hidden">
      {/* Background Pulse */}
      <div className="absolute w-[200px] h-[200px] bg-primary/10 rounded-full blur-[100px] animate-pulse pointer-events-none" />

      <div className="z-10 flex flex-col items-center space-y-8 glass-panel p-16 rounded-2xl border border-white/5 ring-1 ring-primary/20 shadow-2xl">
        {!isQueuing ? (
          <>
            <div className="relative">
              <Swords className="w-24 h-24 text-primary pt-2" />
            </div>

            <h1 className="text-4xl font-black uppercase tracking-widest text-foreground text-center">
              Ready to battle?
            </h1>
            <p className="text-muted-foreground text-lg text-center">
              Click start to find an opponent.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full justify-center">
              <Button
                className="px-8 py-6 uppercase font-bold tracking-wider text-lg w-full sm:w-auto"
                onClick={() => setIsQueuing(true)}
              >
                Start Match
              </Button>
              <Link href="/">
                <Button
                  variant="outline"
                  className="px-8 py-6 uppercase font-bold tracking-wider w-full sm:w-auto"
                >
                  Go Back
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
              <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-20" />
              <Swords className="w-24 h-24 text-primary animate-bounce pt-2" />
            </div>

            <h1 className="text-4xl font-black uppercase tracking-widest text-foreground text-center">
              In Matchmaking Queue
            </h1>
            <p className="text-muted-foreground text-lg animate-pulse text-center">
              Searching for opponent... Time Elapsed: {formatTime(elapsed)}
            </p>

            <Button
              variant="outline"
              className="mt-8 border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-colors duration-300 px-8 py-6 uppercase font-bold tracking-wider"
              onClick={() => setIsQueuing(false)}
            >
              Cancel Queue
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
