"use client";

import Link from "next/link";
import Image from "next/image";
import { Code2, Swords, Trophy, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const ranks = [
    { name: "Iron", icon: "/rank_png/Iron_3_Rank.png", color: "bg-[#928ea0] text-black" },
    { name: "Bronze", icon: "/rank_png/Bronze_3_Rank.png", color: "bg-[#a36b4d] text-white" },
    { name: "Silver", icon: "/rank_png/Silver_3_Rank.png", color: "bg-[#cbd5e1] text-black" },
    { name: "Gold", icon: "/rank_png/Gold_3_Rank.png", color: "bg-[#f0a430] text-black" },
    { name: "Platinum", icon: "/rank_png/Platinum_3_Rank.png", color: "bg-[#4cc9f0] text-black" },
    { name: "Diamond", icon: "/rank_png/Diamond_3_Rank.png", color: "bg-[#4361ee] text-white" },
    { name: "Ascendant", icon: "/rank_png/Ascendant_3_Rank.png", color: "bg-[#06d6a0] text-black" },
    { name: "Immortal", icon: "/rank_png/Immortal_3_Rank.png", color: "bg-[#ef476f] text-white" },
    { name: "Radiant", icon: "/rank_png/Radiant_Rank.png", color: "bg-gradient-to-br from-white to-[#f0a430] text-black" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full relative overflow-hidden bg-background py-24 lg:py-40 flex flex-col items-center justify-center text-center">
          {/* Neon background blobs */}
          <div className="blob-cyan w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60" />
          <div className="blob-pink w-[300px] h-[300px] top-1/4 left-1/4 opacity-40" />
          <div className="blob-purple w-[250px] h-[250px] bottom-1/4 right-1/4 opacity-30" />

          <div className="container max-w-4xl px-4 relative z-10 flex flex-col items-center space-y-8 mt-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(0,245,255,0.2)] bg-[rgba(0,245,255,0.05)] text-[#00f5ff] text-sm font-medium">
              <Zap className="w-4 h-4" /> Server Season 1 is Live
            </div>

            <h1 className="font-pixel text-5xl md:text-7xl text-gradient-primary leading-tight">
              League of Coders
            </h1>
            <p className="font-pixel text-xl md:text-2xl text-[#a855f7] drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]">
              1v1 Competitive Coding Arena
            </p>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Solve problems. Drain HP. Climb the ladder. Become{" "}
              <span className="text-gradient-radiant font-bold">Radiant</span>.
            </p>

            <div className="flex flex-row gap-4 mt-8 flex-wrap justify-center">
              <Link href={isAuthenticated ? "/queue" : "/auth"}>
                <button className="pixel-btn pixel-btn-cyan text-base px-8 py-3">
                  ▶ Find Match
                </button>
              </Link>
              <Link href={isAuthenticated ? "/profile" : "/auth"}>
                <button className="pixel-btn pixel-btn-pink text-base px-8 py-3">
                  👤 My Profile
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full bg-surface-lowest py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="group relative rounded-bl-2xl rounded-br-2xl p-6 bg-surface-low border border-[rgba(0,245,255,0.1)] hover:border-[rgba(0,245,255,0.3)] hover:shadow-[0_0_25px_rgba(0,245,255,0.08)] transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-[#00f5ff] to-[#a855f7]" />
                <Swords className="w-10 h-10 text-[#00f5ff] mb-4 drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]" />
                <h3 className="font-pixel text-xl text-[#00f5ff] mb-3">1v1 Deathmatch</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Face off against opponents of similar skill level. Solve the problem faster and with better optimization to win.
                </p>
              </div>

              {/* Card 2 */}
              <div className="group relative rounded-bl-2xl rounded-br-2xl p-6 bg-surface-low border border-[rgba(255,45,120,0.1)] hover:border-[rgba(255,45,120,0.3)] hover:shadow-[0_0_25px_rgba(255,45,120,0.08)] transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-[#ff2d78] to-[#f0a430]" />
                <Trophy className="w-10 h-10 text-[#ff2d78] mb-4 drop-shadow-[0_0_8px_rgba(255,45,120,0.6)]" />
                <h3 className="font-pixel text-xl text-[#ff2d78] mb-3">True Rank MMR</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Climb the ladder from Iron to Radiant. Our matching engine utilizes strict Elo rating for razor-close matches.
                </p>
              </div>

              {/* Card 3 */}
              <div className="group relative rounded-bl-2xl rounded-br-2xl p-6 bg-surface-low border border-[rgba(168,85,247,0.1)] hover:border-[rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.08)] transition-all duration-300">
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-[#a855f7] to-[#4cc9f0]" />
                <Code2 className="w-10 h-10 text-[#a855f7] mb-4 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                <h3 className="font-pixel text-xl text-[#a855f7] mb-3">Editorial Env</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A deep hardware aesthetic built for absolute focus. Minimal distractions, maximum performance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Rank Tier Showcase */}
        <section className="w-full bg-background py-32 text-center border-y border-[rgba(0,245,255,0.06)] relative z-10">
          <div className="blob-purple w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
          <div className="container mx-auto px-6 max-w-5xl flex flex-col items-center relative z-10">
            <h2 className="font-pixel text-4xl md:text-5xl text-gradient-primary mb-4">
              Prove Your Worth
            </h2>
            <p className="text-muted-foreground mb-16 max-w-xl text-lg">
              9 distinct ranks. Only the absolute elite can touch the{" "}
              <span className="text-gradient-radiant font-bold">Radiant</span> glow.
            </p>

            <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 place-items-center">
              {ranks.map((rank) => (
                <div
                  key={rank.name}
                  className={`flex flex-col items-center gap-3 px-4 py-4 rounded-xl shadow-lg transition-transform duration-300 hover:scale-110 ${rank.color}`}
                >
                  <Image
                    src={rank.icon}
                    alt={`${rank.name} rank icon`}
                    width={84}
                    height={84}
                    className="drop-shadow-[0_0_12px_rgba(0,0,0,0.25)]"
                  />
                  <span className="font-bold text-sm tracking-widest uppercase">
                    {rank.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call To Action */}
        <section className="w-full bg-surface-lowest pt-32 pb-40 flex justify-center relative overflow-hidden">
          <div className="blob-cyan w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />
          <div className="blob-pink w-[200px] h-[200px] top-1/4 right-1/4 opacity-25" />
          <div className="container max-w-4xl px-6 text-center relative z-10">
            <h2 className="font-pixel text-5xl md:text-7xl text-gradient-primary mb-4">
              THE ARENA AWAITS
            </h2>
            <p className="text-muted-foreground text-lg mb-12">No slow algorithms. No mercy.</p>
            <Link href={isAuthenticated ? "/queue" : "/auth"}>
              <button className="pixel-btn pixel-btn-cyan text-xl px-12 py-4">
                <Swords className="inline w-5 h-5 mr-2" />
                Start Your First Match
              </button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
