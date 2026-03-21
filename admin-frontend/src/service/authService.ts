import { apiFetch } from "@/service/api";
import type {
  LoginPayload,
  RegisterPayload,
  UserResponse,
} from "@/types/authTypes";

export const authService = {
  register: async (payload: RegisterPayload): Promise<UserResponse> => {
    return apiFetch<UserResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login: async (payload: LoginPayload): Promise<UserResponse> => {
    return apiFetch<UserResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  googleLogin: async (): Promise<{ url: string }> => {
    return apiFetch<{ url: string }>("/api/auth/google/login", {
      method: "GET",
      credentials: "include", // needed so the oauth_state cookie gets set
    });
  },

  me: async (): Promise<UserResponse> => {
    return apiFetch<UserResponse>("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });
  },

  logout: async (): Promise<{ message: string }> => {
    return apiFetch<{ message: string }>("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  },
};
