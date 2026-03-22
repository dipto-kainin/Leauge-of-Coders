import { apiFetch } from "@/service/api";

export interface TestCaseRequest {
  id?: string;
  input: string;
  output: string;
  points: number;
  is_example: boolean;
}

export interface CreateProblemRequest {
  name: string;
  difficulty: string;
  description: string;
  problem_statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  moderator_emails: string[];
  test_cases: TestCaseRequest[];
}

export type UpdateProblemRequest = CreateProblemRequest;

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  role: string;
  method: string;
}

export interface ProblemResponse {
  id: string;
  name: string;
  difficulty: string;
  slug: string;
  description: string;
  problem_statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  moderators: UserDTO[];
  test_cases: TestCaseRequest[];
  created_at: string;
}

export const problemService = {
  createProblem: async (payload: CreateProblemRequest): Promise<void> => {
    return apiFetch<void>("/api/problems", {
      method: "POST",
      body: JSON.stringify(payload),
      credentials: "include",
    });
  },

  updateProblem: async (id: string, payload: UpdateProblemRequest): Promise<void> => {
    return apiFetch<void>(`/api/problems/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      credentials: "include",
    });
  },

  getAllProblems: async (page: number = 1, limit: number = 10): Promise<{ problems: ProblemResponse[] }> => {
    return apiFetch<{ problems: ProblemResponse[] }>(`/api/problems?page=${page}&limit=${limit}`, {
      method: "GET",
      credentials: "include",
    });
  },

  getProblemBySlug: async (slug: string): Promise<{ problem: ProblemResponse }> => {
    return apiFetch<{ problem: ProblemResponse }>(`/api/problems/${slug}`, {
      method: "GET",
      credentials: "include",
    });
  },
};
