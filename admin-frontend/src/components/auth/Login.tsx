"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import type { LoginPayload } from "@/types/authTypes";

type LoginProps = {
  onSwitch: () => void;
};

export default function Login({ onSwitch }: LoginProps) {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);

  const [form, setForm] = useState<LoginPayload>({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState<string>("");

  const onChange =
    (field: keyof LoginPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      await login(form);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setErrorMessage(message);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 glass-panel p-10 rounded-2xl shadow-2xl relative">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">Sign In</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Connect your account to enter the queue
        </p>
      </div>

      <form className="space-y-6 mt-8" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={form.email}
            onChange={onChange("email")}
            className="w-full bg-surface-lowest border-b-2 border-transparent focus:border-primary text-foreground px-4 py-3 rounded-t-md outline-none transition-all focus:bg-surface-high/50"
            placeholder="developer@example.com"
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={onChange("password")}
            className="w-full bg-surface-lowest border-b-2 border-transparent focus:border-primary text-foreground px-4 py-3 rounded-t-md outline-none transition-all focus:bg-surface-high/50"
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>

        {errorMessage ? (
          <p className="text-sm text-red-400 font-medium">{errorMessage}</p>
        ) : null}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:glow-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Logging in..." : "Login to Arena"}
        </Button>
      </form>

      <div className="mt-8 relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-low px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          variant="outline"
          className="w-full h-12 border-white/10 text-foreground bg-surface-lowest hover:bg-surface-highest transition-colors"
          type="button"
          onClick={loginWithGoogle}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold underline hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          Register
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          Return to Landing Page
        </Link>
      </div>
    </div>
  );
}
