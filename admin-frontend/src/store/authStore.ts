"use client";

import { create } from "zustand";
import { authService } from "@/service/authService";
import type { LoginPayload, RegisterPayload, User } from "@/types/authTypes";

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  register: async (payload) => {
    set({ isLoading: true });

    try {
      const data = await authService.register(payload);

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  login: async (payload) => {
    set({ isLoading: true });

    try {
      const data = await authService.login(payload);

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    const data = await authService.googleLogin();
    window.location.href = data.url;
  },

  fetchMe: async () => {
    set({ isLoading: true });

    try {
      const data = await authService.me();

      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // ignore backend logout failure
    }

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
