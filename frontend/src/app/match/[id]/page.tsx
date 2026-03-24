"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMatchStore, Match, Problem } from "@/store/matchStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/service/api";

interface MatchWithProblem extends Match {
  problem: Problem;
  player1: { id: string; username: string; mmr: number };
  player2: { id: string; username: string; mmr: number };
}

export default function MatchArenaPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
      myPointsPassed,
      opponentPointsPassed,
      totalPoints,
      connectSocket, 
      disconnectSocket, 
      submitCode,
      mySubmissions
  } = useMatchStore();

  const [matchData, setMatchData] = useState<MatchWithProblem | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [code, setCode] = useState("package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Write your code here\n    fmt.Println(\"Hello\")\n}");
  const [language, setLanguage] = useState("go");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<{ tests_passed: number; tests_total: number; status: string } | null>(null);

  // Fetch match from HTTP API on page load
  useEffect(() => {
    apiFetch<MatchWithProblem>(`/api/match/${id}`)
      .then((data) => {
        setMatchData(data);
        // Sync timer with actual start time
        if (data.started_at) {
          const elapsed = Math.floor(
            (Date.now() - new Date(data.started_at).getTime()) / 1000
          );
          setTimeRemaining(Math.max(0, 1800 - elapsed));
        }
      })
      .catch(console.error);
  }, [id]);

  // Connect WebSocket for real-time events (opponent progress, result)
  useEffect(() => {
    connectSocket(id, "");
    return () => disconnectSocket();
  }, [id, connectSocket, disconnectSocket]);

  // Countdown timer
  useEffect(() => {
    if (!matchData || matchData.status === "finished") return;
    const interval = setInterval(() => {
      setTimeRemaining((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [matchData]);

  // Refresh match data when WS signals the match ended
  const { match: wsMatch } = useMatchStore();
  useEffect(() => {
    if (wsMatch?.status === "finished") {
      apiFetch<MatchWithProblem>(`/api/match/${id}`)
        .then(setMatchData)
        .catch(console.error);
    }
  }, [wsMatch?.status, id]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const result = await submitCode(id, code, language);
    if (result) {
      setLastSubmission(result);
    }
    setIsSubmitting(false);
  };

  const isMatchFinished = matchData?.status === "finished";
  const winnerID = matchData?.winner_id;

  const isMatchFinished2 = wsMatch?.status === "finished";
  const effectiveWinnerID = isMatchFinished2 ? wsMatch?.winner_id : winnerID;

  // HP Math: Starts at 100%, drops by (Points / TotalPoints) * 100
  const maxPoints = totalPoints || matchData?.problem?.point_value || 1;
  const myHpPct = Math.max(0, 100 - ((opponentPointsPassed || 0) / maxPoints) * 100);
  const opponentHpPct = Math.max(0, 100 - ((myPointsPassed || 0) / maxPoints) * 100);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      
      {/* Left Pane: Problem Statement */}
      <div className="w-1/2 h-full flex flex-col border-r border-white/10 p-6 overflow-y-auto">
        {matchData?.problem ? (
          <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">{matchData.problem.name}</h1>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold uppercase tracking-wider">
                    {matchData.problem.difficulty}
                </span>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-muted-foreground whitespace-pre-wrap">{matchData.problem.problem_statement}</p>
              
              <h3 className="text-xl font-semibold mt-8 text-primary">Constraints</h3>
              <p className="whitespace-pre-wrap rounded-lg bg-white/5 p-4 font-mono text-sm">{matchData.problem.constraints}</p>
              
              <h3 className="text-xl font-semibold mt-8 text-primary">Input Format</h3>
              <p className="whitespace-pre-wrap rounded-lg bg-white/5 p-4 font-mono text-sm">{matchData.problem.input_format}</p>
              
              <h3 className="text-xl font-semibold mt-8 text-primary">Output Format</h3>
              <p className="whitespace-pre-wrap rounded-lg bg-white/5 p-4 font-mono text-sm">{matchData.problem.output_format}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full animate-pulse text-muted-foreground">
              Loading Problem...
          </div>
        )}
      </div>

      {/* Right Pane: Editor & Arena Status */}
      <div className="w-1/2 h-full flex flex-col bg-[#0d0d0d] relative">
        {/* Top Status Bar */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-background">
            <div className="flex items-center space-x-4">
                <div className={`text-2xl font-mono font-bold ${timeRemaining < 60 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                    {formatTime(timeRemaining)}
                </div>
            </div>
            <div className="flex flex-col items-center space-y-4 px-4 w-1/3">
                 <div className="w-full flex flex-col items-start relative">
                     <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Your HP</span>
                     <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 relative">
                        <div 
                           className="h-full bg-green-500 transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                           style={{ width: `${myHpPct}%` }} 
                        />
                     </div>
                 </div>

                 <div className="w-full flex flex-col items-end relative">
                     <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Opponent HP</span>
                     <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 flex justify-end">
                        <div 
                           className="h-full bg-red-500 transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                           style={{ width: `${opponentHpPct}%` }} 
                        />
                     </div>
                 </div>
            </div>

            <div className="flex items-center space-x-6">
                 <select  
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-background border border-white/20 rounded px-2 py-1 text-sm outline-none focus:border-primary"
                    disabled={isMatchFinished}
                 >
                     <option value="go">Go</option>
                     <option value="python">Python</option>
                     <option value="cpp">C++</option>
                     <option value="java">Java</option>
                     <option value="js">JavaScript</option>
                 </select>
            </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-4 relative">
            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isMatchFinished}
                className="w-full h-full bg-transparent text-gray-300 font-mono text-sm resize-none outline-none p-4 focus:ring-1 focus:ring-primary/50 transition-shadow rounded-lg border border-white/5"
                spellCheck="false"
            />
            
            {/* Disabled Overlay */}
            {isMatchFinished && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                    <div className="text-center bg-background p-8 border border-white/10 shadow-2xl rounded-2xl">
                        <h2 className="text-3xl font-black uppercase mb-2">Match Complete</h2>
                        <p className="text-xl text-primary mb-6">
                            {effectiveWinnerID === user?.id ? "Victory!" : effectiveWinnerID ? "Defeat!" : "Draw!"}
                        </p>
                        <Button onClick={() => router.push('/')} variant="outline" className="px-8">
                            Return Home
                        </Button>
                    </div>
                </div>
            )}
        </div>

        {/* Bottom Action Bar */}
        <div className="h-20 border-t border-white/10 flex items-center justify-between px-6 bg-background">
            <div className="flex flex-col">
               {lastSubmission && (
                   <span className="text-sm font-mono text-muted-foreground">
                       Last Result:{" "}
                       <span className={lastSubmission.status === "accepted" ? "text-primary" : "text-destructive"}>
                           {lastSubmission.status} ({lastSubmission.tests_passed}/{lastSubmission.tests_total})
                       </span>
                   </span>
               )}
            </div>
            <Button
                onClick={handleSubmit}
                disabled={isMatchFinished || isSubmitting}
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-12 py-6 text-lg tracking-widest uppercase font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] transition-all duration-300"
            >
                {isSubmitting ? "Judging..." : "Submit Code"}
            </Button>
        </div>

      </div>
    </div>
  );
}
