import { create } from 'zustand';
import { apiFetch } from '@/service/api';
import { useAuthStore } from '@/store/authStore';

export interface Match {
  id: string;
  status: string;
  player1_id: string;
  player2_id: string;
  problem_id: string;
  winner_id?: string;
  started_at?: string;
  ended_at?: string;
}

export interface Problem {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  slug: string;
  problem_statement: string;
  input_format: string;
  output_format: string;
  constraints: string;
  point_value: number;
  success_rate: number;
}

export interface Submission {
  id: string;
  match_id: string;
  user_id: string;
  code: string;
  language: string;
  tests_passed: number;
  tests_total: number;
  status: string;
  submitted_at: string;
}

interface MatchState {
  match: Match | null;
  opponent: any | null; // using any for user model simplicity, or could define User interface
  problem: Problem | null;
  timeRemaining: number;
  mySubmissions: Submission[];
  myPointsPassed: number | null;
  opponentPointsPassed: number | null;
  totalPoints: number | null;
  socket: WebSocket | null;
  queuePosition: number;
  
  joinQueue: (token: string) => Promise<void>;
  leaveQueue: (token: string) => Promise<void>;
  submitCode: (matchID: string, code: string, language: string) => Promise<Submission | null>;
  connectSocket: (matchID: string, token: string) => void;
  disconnectSocket: () => void;
  resetMap: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  match: null,
  opponent: null,
  problem: null,
  timeRemaining: 1800, // 30 minutes in seconds
  mySubmissions: [],
  myPointsPassed: null,
  opponentPointsPassed: null,
  totalPoints: null,
  socket: null,
  queuePosition: 0,

  resetMap: () => set({
    match: null,
    opponent: null,
    problem: null,
    timeRemaining: 1800,
    mySubmissions: [],
    myPointsPassed: null,
    opponentPointsPassed: null,
    totalPoints: null,
    socket: null,
    queuePosition: 0,
  }),

  joinQueue: async (token: string) => {
    try {
      const data = await apiFetch<any>('/api/queue/join', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      set({ queuePosition: data.queuePosition });
    } catch (e) {
      console.error("Failed to join queue", e);
    }
  },

  leaveQueue: async (token: string) => {
    try {
      await apiFetch<any>('/api/queue/leave', {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });
      set({ queuePosition: 0 });
    } catch (e) {
      console.error("Failed to leave queue", e);
    }
  },

  submitCode: async (matchID: string, code: string, language: string) => {
    if (!matchID) return null;
    try {
      const submission = await apiFetch<Submission>(`/api/match/${matchID}/submit`, {
        method: 'POST',
        body: JSON.stringify({ code, language })
      });
      set((state) => ({
        mySubmissions: [submission, ...state.mySubmissions]
      }));
      return submission;
    } catch (e) {
      console.error('Submit failed:', e);
      return null;
    }
  },

  connectSocket: (matchID: string, token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const wsProto = baseUrl.startsWith("https") ? "wss:" : "ws:";
    const host = baseUrl.replace(/^https?:\/\//, "");
    
    // Passing token via query param as WS doesn't typically accept Auth headers easily from browser API.
    const wsUrl = `${wsProto}//${host}/api/ws/match/${matchID}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    let timerInterval: NodeJS.Timeout;

    ws.onopen = () => {
      console.log("Connected to match socket");
      
      timerInterval = setInterval(() => {
        set((state) => ({
           timeRemaining: Math.max(0, state.timeRemaining - 1)
        }));
      }, 1000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'match_found') {
        const payload = data.payload;
        set({
           match: { id: payload.match_id } as Match,
           problem: payload.problem
        });
      } else if (data.type === 'opponent_submitted') {
        const payload = data.payload;
        const currentUserId = useAuthStore.getState().user?.id;
        if (payload.submitter_id === currentUserId) {
          set({
            myPointsPassed: payload.points_passed,
            totalPoints: payload.points_total
          });
        } else {
          set({
            opponentPointsPassed: payload.points_passed,
            totalPoints: payload.points_total
          });
        }
      } else if (data.type === 'match_result') {
        set((state) => ({ match: { ...state.match, status: 'finished', winner_id: data.payload.winner_id } as Match }));
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from match socket");
      clearInterval(timerInterval);
      set({ socket: null });
    };

    set({ socket: ws });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null });
    }
  }
}));
