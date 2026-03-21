"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Swords, Trophy, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const ranks = [
    { name: "Iron", color: "bg-[#928ea0] text-black" },
    { name: "Bronze", color: "bg-[#a36b4d] text-white" },
    { name: "Silver", color: "bg-[#cbd5e1] text-black" },
    { name: "Gold", color: "bg-[#f0a430] text-black" },
    { name: "Platinum", color: "bg-[#4cc9f0] text-black" },
    { name: "Diamond", color: "bg-[#4361ee] text-white" },
    { name: "Ascendant", color: "bg-[#06d6a0] text-black" },
    { name: "Immortal", color: "bg-[#ef476f] text-white" },
    {
      name: "Radiant",
      color: "bg-gradient-to-br from-white to-[#f0a430] text-black",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation Bar */}
      {/* No lines, background-shifting for the header instead of borders */}
      <Navbar />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full relative overflow-hidden bg-background py-24 lg:py-40 flex flex-col items-center justify-center text-center">
          {/* Subtle Glow Background Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="container max-w-4xl px-4 relative z-10 flex flex-col items-center space-y-8 mt-10">
            <Badge
              variant="outline"
              className="px-4 py-1 text-primary border-primary/20 bg-surface-lowest"
            >
              <Zap className="w-4 h-4 mr-2" /> Server Season 1 is Live
            </Badge>

            <h1 className="text-5xl md:text-7xl font-black tracking-[-0.04em] text-foreground uppercase leading-tight">
              Code Is A <br className="hidden sm:block" />
              <span className="text-gradient-primary">
                High-Intensity Sport
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
              1v1 ranked competitive programming. No slow algorithms. No
              unoptimized loops. Draft, code, and execute your way to Radiant.
            </p>

            <div className="flex flex-row gap-4 mt-8">
              <Link href="/queue">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg font-bold bg-linear-to-br from-primary to-[#8e7fff] text-white hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_25px_rgba(124,106,247,0.4)]"
                >
                  Enter Queue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/profile">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg font-bold border-border/20 text-muted-foreground hover:bg-surface-highest hover:text-foreground transition-all duration-300"
                >
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full bg-surface-lowest py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-t-[3px] border-t-primary/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-gradient(to-b, from-primary/5, to-transparent) opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader>
                  <Swords className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>1v1 Deathmatch</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Face off against opponents of similar skill level. Solve the
                    problem faster and with better optimization to win.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-t-[3px] border-t-secondary/50 relative overflow-hidden group hover:translate-y-1">
                <div className="absolute inset-0 bg-linear-gradient(to-b, from-secondary/5, to-transparent) opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader>
                  <Trophy className="w-10 h-10 text-secondary mb-2" />
                  <CardTitle>True Rank MMR</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Climb the ladder from Iron to Radiant. Our matching engine
                    utilizes strict Elo rating for razor-close matches.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-t-[3px] border-t-platinum/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-gradient(to-b, from-platinum/5, to-transparent) opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader>
                  <Code2 className="w-10 h-10 text-platinum mb-2" />
                  <CardTitle>Editorial Environment</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    A deep hardware aesthetic built for absolute focus. Minimal
                    distractions, maximum performance.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Rank Tier Showcase */}
        <section className="w-full bg-background py-32 text-center border-y border-white/5 relative z-10 glass-panel">
          <div className="container mx-auto px-6 max-w-5xl flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-[-0.04em] mb-4 uppercase">
              Prove Your Worth
            </h2>
            <p className="text-muted-foreground mb-16 max-w-xl text-lg">
              9 distinct ranks. Only the absolute elite can touch the Radiant
              glow. Where will you finish this season?
            </p>

            <div className="w-full flex flex-wrap justify-center gap-4">
              {ranks.map((rank) => (
                <div
                  key={rank.name}
                  className={`px-6 py-3 rounded-md font-bold text-sm tracking-widest uppercase shadow-lg hover:scale-110 transition-transform duration-300 cursor-default ${rank.color}`}
                >
                  {rank.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call To Action */}
        <section className="w-full bg-surface-lowest pt-32 pb-40 flex justify-center">
          <div className="container max-w-4xl px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-black mb-8">
              THE ARENA AWAITS
            </h2>
            <Link href="/queue">
              <Button
                size="lg"
                className="h-16 px-12 text-xl font-bold bg-linear-to-br from-primary to-[#8e7fff] text-white hover:shadow-[0_0_40px_rgba(124,106,247,0.5)] hover:scale-105 transition-all duration-300"
              >
                Start Your First Match <Swords className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
