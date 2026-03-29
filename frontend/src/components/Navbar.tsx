"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuthStore();
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-[rgba(0,245,255,0.08)] transition-colors duration-300">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex flex-row items-center space-x-2">
          <Swords className="w-7 h-7 text-[#00f5ff] drop-shadow-[0_0_8px_rgba(0,245,255,0.7)]" />
          <span className="font-pixel text-2xl neon-text tracking-wide">
            League-of-Coders
          </span>
        </div>
        <nav className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              <Link
                href="/profile"
                className="text-sm font-medium text-muted-foreground hover:text-[#00f5ff] hover:drop-shadow-[0_0_6px_rgba(0,245,255,0.7)] transition-all duration-200 px-3 py-1"
              >
                Profile
              </Link>
              <button
                className="text-sm font-medium text-muted-foreground hover:text-[#ff2d78] hover:drop-shadow-[0_0_6px_rgba(255,45,120,0.7)] transition-all duration-200 px-3 py-1 cursor-pointer"
                onClick={logout}
              >
                Logout
              </button>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-muted-foreground hover:text-[#a855f7] hover:drop-shadow-[0_0_6px_rgba(168,85,247,0.7)] transition-all duration-200 px-3 py-1"
                >
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/auth"
              className="text-sm font-medium text-muted-foreground hover:text-[#00f5ff] hover:drop-shadow-[0_0_6px_rgba(0,245,255,0.7)] transition-all duration-200 px-3 py-1"
            >
              Login
            </Link>
          )}
          <Link href={isAuthenticated ? "/queue" : "/auth"}>
            <button className="pixel-btn pixel-btn-cyan ml-2">
              ▶ Play Now
            </button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
