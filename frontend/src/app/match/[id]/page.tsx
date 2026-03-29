"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMatchStore, Match, Problem } from "@/store/matchStore";
import { useAuthStore } from "@/store/authStore";
import { apiFetch } from "@/service/api";
import Editor from "@monaco-editor/react";
import AuthGuard from "@/components/auth/AuthGuard";

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
      submitCode
  } = useMatchStore();

  const [matchData, setMatchData] = useState<MatchWithProblem | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [code, setCode] = useState("function setup() {\n  // Write your code here\n  console.log(\"Ready\");\n}");
  const [language, setLanguage] = useState("javascript");
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

  // Fallback Polling: Fetch match data every 5 seconds to catch missed WS events
  useEffect(() => {
    if (matchData?.status === "finished") return;

    const pollInterval = setInterval(() => {
      apiFetch<MatchWithProblem>(`/api/match/${id}`)
        .then((data) => {
          setMatchData(data);
        })
        .catch(console.error);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [id, matchData?.status]);

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

  const handleRunTests = async () => {
    // Placeholder for run tests logic if different from submit
    if (isSubmitting) return;
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    let submitLang = language;
    if (language === "javascript") submitLang = "js";
    try {
      const result = await submitCode(id, code, submitLang);
      if (result) {
        setLastSubmission(result);
      }
    } catch (e: any) {
      alert(e.message || "Submit failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMatchFinished = matchData?.status === "finished";
  const winnerID = matchData?.winner_id;

  const isMatchFinished2 = wsMatch?.status === "finished";
  const effectiveWinnerID = isMatchFinished2 ? wsMatch?.winner_id : winnerID;

  // Identify Player 1 (me) and Player 2 (opponent)
  const isPlayer1 = matchData?.player1_id === user?.id;
  
  // Since User struct may be serialized with capitalized keys from backend:
  const getUsername = (p: any) => p?.username || p?.Username || "Opponent";
  
  const myUsername = user?.username || getUsername(isPlayer1 ? matchData?.player1 : matchData?.player2);
  const opponentUsername = isPlayer1 ? getUsername(matchData?.player2) : getUsername(matchData?.player1);

  // HP Math: Starts at 100%, drops by (Points / TotalPoints) * 100
  const maxPoints = totalPoints || matchData?.problem?.point_value || 1;
  let myHpPct = Math.max(0, 100 - ((opponentPointsPassed || 0) / maxPoints) * 100);
  let opponentHpPct = Math.max(0, 100 - ((myPointsPassed || 0) / maxPoints) * 100);

  if (isMatchFinished || isMatchFinished2) {
    if (!effectiveWinnerID) {
      myHpPct = 0;
      opponentHpPct = 0;
    } else if (effectiveWinnerID === user?.id) {
      opponentHpPct = 0;
    } else {
      myHpPct = 0;
    }
  }

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
        
        {/* Top Header Area bridging both panels */}
        <header className="h-20 w-full border-b border-[rgba(0,245,255,0.08)] bg-surface-lowest flex items-center justify-between px-8 relative shrink-0">
          
          {/* Player 1 (Me) Info & HP Bar */}
          <div className="flex flex-col w-[35%]">
              <div className="flex justify-between text-sm mb-1">
                  <span className="font-pixel text-lg neon-text">{myUsername || "Loading..."}</span>
                  <span className="font-pixel text-muted-foreground">{Math.round(myHpPct)}/100 HP</span>
              </div>
              <div className="w-full h-4 bg-surface-highest rounded-full border border-white/5 overflow-hidden ring-1 ring-[#00f5ff]/20">
                  <div 
                      className="h-full bg-gradient-to-r from-[#00f5ff] to-[#00ff88] transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] shadow-[0_0_15px_rgba(0,245,255,0.6)]" 
                      style={{ width: `${myHpPct}%` }} 
                  />
              </div>
          </div>

          {/* Center VS & Timer */}
          <div className="flex flex-col items-center justify-center relative translate-y-1">
              <span className="font-pixel text-4xl text-[#ff2d78] drop-shadow-[0_0_15px_rgba(255,45,120,0.8)]">VS</span>
              <span className={`font-pixel text-xl mt-1 tracking-widest ${timeRemaining < 60 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                  {formatTime(timeRemaining)}
              </span>
          </div>

          {/* Player 2 (Opponent) Info & HP Bar */}
          <div className="flex flex-col w-[35%] items-end">
              <div className="flex justify-between text-sm mb-1 w-full flex-row-reverse">
                  <span className="font-pixel text-lg text-muted-foreground">{opponentUsername || "Opponent"}</span>
                  <span className="font-pixel text-muted-foreground">{Math.round(opponentHpPct)}/100 HP</span>
              </div>
              <div className="w-full h-4 bg-surface-highest rounded-full border border-white/5 flex justify-end overflow-hidden ring-1 ring-[#ff2d78]/20">
                  <div 
                      className="h-full bg-gradient-to-l from-[#ff2d78] to-[#f0a430] transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] shadow-[0_0_15px_rgba(255,45,120,0.6)]" 
                      style={{ width: `${opponentHpPct}%` }} 
                  />
              </div>
          </div>
        </header>

        {/* Main Split Content Area */}
        <div className="flex flex-1 overflow-hidden p-6 gap-6 relative">
            
            {/* Left Pane: Problem Statement */}
            <div className="w-1/2 h-full flex flex-col neon-card p-6 overflow-y-auto bg-surface-lowest">
              {matchData?.problem ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                      <h1 className="font-pixel text-3xl neon-text-green drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]">{matchData.problem.name}</h1>
                      <span className="px-3 py-1 bg-[#f0a430]/10 text-[#f0a430] border border-[#f0a430]/30 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(240,164,48,0.2)]">
                          {matchData.problem.difficulty}
                      </span>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">{matchData.problem.problem_statement}</p>
                    
                    <h3 className="font-pixel text-xl mt-8 text-[#a855f7] mb-2">Constraints</h3>
                    <div className="rounded-xl bg-surface-high border border-white/5 p-4 font-mono text-sm text-gray-300 shadow-inner">
                        {matchData.problem.constraints}
                    </div>
                    
                    <h3 className="font-pixel text-xl mt-8 text-[#a855f7] mb-2">Input Format</h3>
                    <div className="rounded-xl bg-surface-high border border-white/5 p-4 font-mono text-sm text-gray-300 shadow-inner">
                        {matchData.problem.input_format}
                    </div>
                    
                    <h3 className="font-pixel text-xl mt-8 text-[#a855f7] mb-2">Output Format</h3>
                    <div className="rounded-xl bg-surface-high border border-white/5 p-4 font-mono text-sm text-gray-300 shadow-inner">
                        {matchData.problem.output_format}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full animate-pulse text-[#00f5ff]">
                    Loading Problem Data...
                </div>
              )}
            </div>

            {/* Right Pane: Code Editor */}
            <div className="w-1/2 h-full flex flex-col neon-card overflow-hidden bg-[#1e1e1e]">
              
              {/* Editor Inner Header */}
              <div className="h-12 bg-surface-lowest border-b border-[rgba(0,245,255,0.1)] flex items-center justify-between px-4 shrink-0">
                  <span className="font-pixel text-sm text-[#00f5ff]">Code Editor</span>
                  
                  <select  
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      className="bg-surface-high text-xs font-mono border border-white/10 rounded px-2 py-1 outline-none focus:border-[#00f5ff] text-muted-foreground"
                      disabled={isMatchFinished}
                  >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="go">Go</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                  </select>
              </div>

              {/* Monaco Editor Container */}
              <div className="flex-1 relative w-full pt-4">
                  <Editor
                      height="100%"
                      width="100%"
                      theme="vs-dark"
                      language={language}
                      value={code}
                      onChange={(value) => setCode(value || "")}
                      options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                          scrollBeyondLastLine: false,
                          readOnly: isMatchFinished,
                          smoothScrolling: true,
                          cursorBlinking: "smooth",
                          padding: { top: 16 }
                      }}
                  />
                  
                  {/* Disabled Overlay on Match Finish */}
                  {isMatchFinished && (
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
                          <div className="text-center glass-panel p-8 rounded-2xl border border-[rgba(0,245,255,0.2)] shadow-[0_0_30px_rgba(0,245,255,0.1)]">
                              <h2 className="font-pixel text-4xl mb-4 text-[#00f5ff] drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]">Match Complete</h2>
                              <p className="text-2xl font-bold mb-8">
                                  {effectiveWinnerID === user?.id ? (
                                      <span className="text-[#00ff88]">V I C T O R Y</span>
                                  ) : effectiveWinnerID ? (
                                      <span className="text-[#ff2d78]">D E F E A T</span>
                                  ) : (
                                      <span className="text-[#f0a430]">D R A W</span>
                                  )}
                              </p>
                              <button onClick={() => router.push('/')} className="pixel-btn pixel-btn-cyan w-full py-3">
                                  ▶ Return to Arena
                              </button>
                          </div>
                      </div>
                  )}
              </div>

              {/* Bottom Action Bar */}
              <div className="h-16 bg-surface-lowest border-t border-[rgba(0,245,255,0.1)] flex items-center justify-between px-4 shrink-0">
                  <div className="w-1/2 pr-2">
                      <button 
                          onClick={handleRunTests}
                          disabled={isMatchFinished || isSubmitting}
                          className="w-full h-10 rounded text-sm font-bold tracking-widest text-white disabled:opacity-50 transition-all bg-gradient-to-r from-[#4cc9f0] to-[#7c6af7] hover:shadow-[0_0_15px_rgba(124,106,247,0.5)]"
                      >
                          ▶ RUN TESTS
                      </button>
                  </div>
                  <div className="w-1/2 pl-2 flex items-center justify-end">
                      {lastSubmission && (
                        <span className={`text-xs mr-4 font-mono font-bold ${lastSubmission.status === "accepted" ? "text-[#00ff88]" : "text-[#ff2d78]"}`}>
                            {lastSubmission.status} ({lastSubmission.tests_passed}/{lastSubmission.tests_total})
                        </span>
                      )}
                      <button
                          onClick={handleSubmit}
                          disabled={isMatchFinished || isSubmitting}
                          className="h-10 px-8 rounded text-sm font-bold tracking-widest text-[#000] disabled:opacity-50 transition-all bg-gradient-to-r from-[#00ff88] to-[#00f5ff] hover:shadow-[0_0_15px_rgba(0,255,136,0.5)]"
                      >
                          {isSubmitting ? "JUDGING..." : "✓ SUBMIT"}
                      </button>
                  </div>
              </div>

            </div>
        </div>
      </div>
    </AuthGuard>
  );
}
