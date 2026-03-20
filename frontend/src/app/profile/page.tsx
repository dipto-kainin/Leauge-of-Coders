import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-surface-lowest p-8 md:p-16">
      <Link
        href="/"
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Arena
      </Link>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-8 bg-surface-low p-8 rounded-xl shadow-lg border border-white/5">
          <div className="w-32 h-32 rounded-full bg-surface-highest border-4 border-primary/50 flex items-center justify-center glow-primary">
            <User className="w-16 h-16 text-muted-foreground" />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-black uppercase">Faker_Mid</h1>
            <p className="text-muted-foreground">
              Joined Season 1 • 240 Matches Played
            </p>
          </div>
          <div className="bg-diamond text-white px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(67,97,238,0.4)] text-center">
            <p className="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">
              Current Rank
            </p>
            <p className="text-3xl font-black">Diamond III</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">58.4%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                Peak Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-secondary">2140 MMR</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                Win Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-ascendant">8 W</p>
            </CardContent>
          </Card>
        </div>

        {/* Match History Table Skeleton */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-surface-lowest rounded-md border border-white/5 hover:bg-surface-highest transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-2 h-12 rounded-full ${i % 2 === 0 ? "bg-destructive" : "bg-ascendant"}`}
                    />
                    <div>
                      <p className="font-bold">
                        {i % 2 === 0 ? "Defeat" : "Victory"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Two Sum Optimizations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${i % 2 === 0 ? "text-destructive" : "text-ascendant"}`}
                    >
                      {i % 2 === 0 ? "-14" : "+22"} RR
                    </p>
                    <p className="text-sm text-muted-foreground">
                      vs Chovy_XYZ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
