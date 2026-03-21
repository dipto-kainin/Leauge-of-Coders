"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== "admin") {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-primary animate-pulse">
          <ShieldAlert className="w-12 h-12" />
          <p className="text-xl font-bold tracking-widest uppercase">Verifying Clearance</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
