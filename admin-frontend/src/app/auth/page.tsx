"use client";

import { useState } from "react";
import { Swords } from "lucide-react";
import Login from "@/components/auth/Login";
import Register from "@/components/auth/Register";

type Mode = "login" | "covering-to-register" | "register" | "covering-to-login";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");

  const goToRegister = () => {
    if (mode !== "login") return;
    setMode("covering-to-register");

    setTimeout(() => {
      setMode("register");
    }, 700);
  };

  const goToLogin = () => {
    if (mode !== "register") return;
    setMode("covering-to-login");

    setTimeout(() => {
      setMode("login");
    }, 700);
  };

  const showLogin = mode === "login" || mode === "covering-to-login";
  const showRegister = mode === "register" || mode === "covering-to-register";

  const brandingClass =
    mode === "login"
      ? "left-0 w-1/2"
      : mode === "covering-to-register"
        ? "left-0 w-full"
        : mode === "register"
          ? "right-0 w-1/2"
          : "right-0 w-full";

  const loginPanelClass =
    mode === "login"
      ? "left-1/2 opacity-100 translate-x-0 pointer-events-auto"
      : "left-0 opacity-0 -translate-x-8 pointer-events-none";

  const registerPanelClass =
    mode === "register"
      ? "left-0 opacity-100 translate-x-0 pointer-events-auto"
      : "left-1/2 opacity-0 translate-x-8 pointer-events-none";

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="relative h-screen w-full overflow-hidden">
        {/* Branding Panel */}
        <div
          className={`absolute top-0 h-full z-20 bg-surface-lowest border-white/5 flex flex-col justify-center items-center p-12 transition-all duration-700 ease-in-out ${brandingClass} ${
            mode === "login" || mode === "covering-to-register"
              ? "border-r"
              : "border-l"
          }`}
        >
          <div className="absolute inset-0 bg-[url('/screen.png')] bg-cover bg-center opacity-10 mix-blend-overlay" />
          <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />

          <div className="z-10 flex flex-col items-center space-y-6 text-center">
            <Swords className="w-20 h-20 text-primary drop-shadow-[0_0_15px_rgba(124,106,247,0.5)]" />
            <h1 className="text-5xl font-black uppercase tracking-[-0.04em]">
              Leauge-of-Coders
            </h1>
            <p className="text-xl text-muted-foreground max-w-sm">
              Prove your coding mastery in the ultimate 1v1 battleground.
            </p>
          </div>
        </div>

        {/* Login Panel */}
        <div
          className={`absolute top-0 h-full w-1/2 flex items-center justify-center p-8 bg-surface-low transition-all duration-500 ease-in-out ${loginPanelClass}`}
        >
          {showLogin && <Login onSwitch={goToRegister} />}
        </div>

        {/* Register Panel */}
        <div
          className={`absolute top-0 h-full w-1/2 flex items-center justify-center p-8 bg-surface-low transition-all duration-500 ease-in-out ${registerPanelClass}`}
        >
          {showRegister && <Register onSwitch={goToLogin} />}
        </div>
      </div>
    </div>
  );
}
