"use client";

import { useEffect, useState } from "react";
import { Swords } from "lucide-react";
import Link from "next/link";
import { useMatchStore } from "@/store/matchStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

export default function QueuePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { joinQueue, leaveQueue } = useMatchStore();

  const [isQueuing, setIsQueuing] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isQueuing) return;

    joinQueue("").catch((e: any) => {
      alert(e.message || "Failed to join queue");
      setIsQueuing(false);
    });
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
          
          try {
            const audio = new Audio("/match-found-valorant.mp3");
            audio.volume = 0.5;
            audio.play().catch(e => console.error("Audio block:", e));
          } catch (e) {
            console.error("Audio init error:", e);
          }

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
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-background items-center justify-center relative overflow-hidden">
        {/* Neon background blobs */}
        <div className="blob-cyan w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-25" />
        <div className="blob-pink w-[250px] h-[250px] top-1/4 right-1/4 opacity-20" />

        <div className="z-10 flex flex-col items-center space-y-8 glass-panel p-16 rounded-3xl shadow-[0_0_50px_rgba(0,245,255,0.08)] max-w-lg w-full mx-4">
          {!isQueuing ? (
            <>
              <div className="relative">
                <Swords className="w-24 h-24 text-[#00f5ff] pt-2 drop-shadow-[0_0_15px_rgba(0,245,255,0.8)]" />
              </div>

              <h1 className="font-pixel text-4xl neon-text text-center">
                Ready to battle?
              </h1>
              <p className="text-muted-foreground text-lg text-center">
                Click start to find an opponent.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full justify-center">
                <button
                  className="pixel-btn pixel-btn-cyan text-base px-8 py-3 w-full sm:w-auto"
                  onClick={() => setIsQueuing(true)}
                >
                  ▶ Start Match
                </button>
                <Link href="/" className="w-full sm:w-auto">
                  <button className="pixel-btn pixel-btn-purple text-base px-8 py-3 w-full">
                    Go Back
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 border-2 border-[#00f5ff] rounded-full animate-ping opacity-30" />
                <Swords className="w-24 h-24 text-[#00f5ff] animate-bounce pt-2 drop-shadow-[0_0_15px_rgba(0,245,255,0.8)]" />
              </div>

              <h1 className="font-pixel text-3xl neon-text text-center">
                In Matchmaking Queue
              </h1>
              <p className="text-muted-foreground text-lg animate-pulse text-center">
                Searching for opponent...{" "}
                <span className="font-pixel text-[#00f5ff]">{formatTime(elapsed)}</span>
              </p>

              <button
                className="pixel-btn pixel-btn-pink mt-4 px-8 py-3 text-base"
                onClick={() => setIsQueuing(false)}
              >
                ✕ Cancel Queue
              </button>
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
