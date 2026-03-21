import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuthStore();
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex flex-row items-center space-x-2">
          <Swords className="w-8 h-8 text-primary" />
          <span className="text-xl font-black tracking-tighter text-foreground uppercase">
            Leauge-of-Coders
          </span>
        </div>
        <nav className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/profile"
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                Profile
              </Link>
              <Button
                className="text-sm font-medium bg-transparent text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                onClick={logout}
              >
                Logout
              </Button>
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  Admin
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/auth"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Login
            </Link>
          )}
          <Link href="/queue">
            <Button className="font-bold relative group bg-linear-to-br from-primary to-[#8e7fff] text-white border-none hover:shadow-[0_0_20px_rgba(124,106,247,0.3)] transition-all">
              Play Now
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
