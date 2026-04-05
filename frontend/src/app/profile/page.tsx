"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import AuthGuard from "@/components/auth/AuthGuard";
import Image from "next/image";
import { getRankFromMmr, toWinRatePercentage } from "@/lib/rank";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const mmr = user?.mmr ?? 1000;
  const matchesPlayed = user?.matches_played ?? 0;
  const winRate = toWinRatePercentage(user?.win_rate ?? 0);
  const rank = getRankFromMmr(mmr, matchesPlayed);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background p-8 md:p-16 relative overflow-hidden">
        {/* Background blobs */}
        <div className="blob-cyan w-[400px] h-[400px] top-0 right-0 opacity-20" />
        <div className="blob-pink w-[300px] h-[300px] bottom-0 left-0 opacity-15" />

        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-[#00f5ff] hover:drop-shadow-[0_0_6px_rgba(0,245,255,0.6)] mb-8 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Arena
        </Link>

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center gap-8 bg-surface-low p-8 rounded-2xl border border-[rgba(0,245,255,0.1)] shadow-[0_0_30px_rgba(0,245,255,0.05)]">
            <div className="w-32 h-32 rounded-full bg-surface-highest border-4 border-[#00f5ff] flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.4)]">
              <User className="w-16 h-16 text-[#00f5ff]" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h1 className="font-pixel text-4xl neon-text">{user?.username ?? "Player"}</h1>
              <p className="text-muted-foreground">
                Joined Season 1 • {matchesPlayed} Matches Played
              </p>
            </div>
            <div className="bg-surface-high px-8 py-4 rounded-2xl border border-[#4361ee]/40 shadow-[0_0_20px_rgba(67,97,238,0.3)] text-center">
              <div className="mb-3 flex justify-center">
                {rank.iconPath ? (
                  <Image
                    src={rank.iconPath}
                    alt={rank.label}
                    width={84}
                    height={84}
                    className="drop-shadow-[0_0_10px_rgba(67,97,238,0.4)]"
                    priority
                  />
                ) : (
                  <div className="w-[84px] h-[84px] rounded-full border border-[rgba(255,255,255,0.2)] bg-surface-highest flex items-center justify-center">
                    <span className="font-pixel text-4xl text-muted-foreground">?</span>
                  </div>
                )}
              </div>
              <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-1">
                Current Rank
              </p>
              <p className={`font-pixel text-3xl ${rank.colorClass}`}>{rank.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{mmr} MMR</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl bg-surface-low border border-[rgba(0,245,255,0.1)] hover:border-[rgba(0,245,255,0.25)] transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                  Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-pixel text-4xl neon-text">{winRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-surface-low border border-[rgba(240,164,48,0.15)] hover:border-[rgba(240,164,48,0.35)] transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                  Current MMR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-pixel text-4xl text-[#f0a430] drop-shadow-[0_0_8px_rgba(240,164,48,0.6)]">
                  {mmr} MMR
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl bg-surface-low border border-[rgba(0,255,136,0.12)] hover:border-[rgba(0,255,136,0.3)] transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                  Rank Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-pixel text-2xl neon-text-green">
                  {rank.isUnranked ? "Placement (?)" : "Ranked"}
                </p>
                {rank.isUnranked && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete 10 matches to reveal your rank.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Match History Placeholder */}
          <Card className="mt-8 rounded-2xl bg-surface-low border border-[rgba(0,245,255,0.08)]">
            <CardHeader>
              <CardTitle className="font-pixel text-2xl neon-text">Recent Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-[rgba(255,255,255,0.05)] bg-surface-lowest p-6 text-center text-muted-foreground">
                Match history integration is pending backend match list API.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
