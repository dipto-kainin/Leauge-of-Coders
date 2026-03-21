"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type RegisterProps = {
  onSwitch: () => void;
};

export default function Register({ onSwitch }: RegisterProps) {
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const checks = useMemo(() => {
    const minLength = password.length >= 8;
    const allowedCharsOnly =
      password.length > 0 && /^[A-Za-z0-9@#!$%]+$/.test(password);
    const hasUpperAndLower = /[A-Z]/.test(password) && /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return {
      minLength,
      allowedCharsOnly,
      hasUpperAndLower,
      hasNumber,
    };
  }, [password]);

  const score = Object.values(checks).filter(Boolean).length;

  const strengthLabel =
    score <= 1
      ? "Weak"
      : score === 2
        ? "Fair"
        : score === 3
          ? "Good"
          : "Strong";

  const widthClass =
    score === 0
      ? "w-0"
      : score === 1
        ? "w-1/4"
        : score === 2
          ? "w-2/4"
          : score === 3
            ? "w-3/4"
            : "w-full";

  const validate = () => {
    if (!username.trim()) return "Username is required";
    if (username.trim().length < 3)
      return "Username must be at least 3 characters";

    if (!email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return "Please enter a valid email";

    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!checks.allowedCharsOnly)
      return "Password can only contain letters, numbers, and @ # ! $ %";
    if (!checks.hasUpperAndLower)
      return "Password must include uppercase and lowercase letters";
    if (!checks.hasNumber) return "Password must include at least one number";

    if (!confirmPassword) return "Confirm password is required";
    if (password !== confirmPassword) return "Passwords do not match";

    return "";
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      await register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword,
      });

      setSuccessMessage("Registration successful. You are now logged in.");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Try again.";
      setErrorMessage(message);
    }
  };

  return (
    <div className="w-full max-w-xl space-y-6 glass-panel p-6 rounded-2xl shadow-2xl relative">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">Register</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Create your account to enter the arena
        </p>
      </div>

      <form className="space-y-6 mt-8" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-surface-lowest border-b-2 border-transparent focus:border-primary text-foreground px-4 py-3 rounded-t-md outline-none transition-all focus:bg-surface-high/50"
            placeholder="kainin"
            autoComplete="username"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface-lowest border-b-2 border-transparent focus:border-primary text-foreground px-4 py-3 rounded-t-md outline-none transition-all focus:bg-surface-high/50"
            placeholder="developer@example.com"
            autoComplete="email"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-lowest border-b-2 border-transparent focus:border-primary text-foreground px-4 py-3 pb-3 pr-12 rounded-t-md outline-none transition-all focus:bg-surface-high/50"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={isLoading}
            >
              <Eye className="w-5 h-5 cursor-pointer" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider">
            <span className="text-muted-foreground">Password Strength</span>
            <span className="font-semibold text-foreground">
              {strengthLabel}
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-surface-lowest overflow-hidden">
            <div
              className={`h-full rounded-full bg-primary transition-all duration-300 ${widthClass}`}
            />
          </div>
          <ul className="space-y-1 text-md">
            <li
              className={
                checks.minLength ? "text-foreground" : "text-muted-foreground"
              }
            >
              {checks.minLength ? "✓" : "•"} 8+ characters
            </li>
            <li
              className={
                checks.allowedCharsOnly
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {checks.allowedCharsOnly ? "✓" : "•"} Only letters, numbers, and @
              # ! $ % allowed
            </li>
            <li
              className={
                checks.hasUpperAndLower
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {checks.hasUpperAndLower ? "✓" : "•"} At least one uppercase and
              one lowercase letter
            </li>
            <li
              className={
                checks.hasNumber ? "text-foreground" : "text-muted-foreground"
              }
            >
              {checks.hasNumber ? "✓" : "•"} At least one number (0-9)
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-surface-lowest border-b-2 border-transparent focus:border-primary text-foreground px-4 py-3 rounded-t-md outline-none transition-all focus:bg-surface-high/50"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading}
          />
        </div>

        {errorMessage ? (
          <p className="text-sm text-red-400 font-medium">{errorMessage}</p>
        ) : null}

        {successMessage ? (
          <p className="text-sm text-emerald-400 font-medium">
            {successMessage}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground hover:glow-hover transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? "Registering..." : "Register in Arena"}
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

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-bold underline hover:text-foreground transition-colors"
        >
          Login
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
