"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { problemService, ProblemResponse } from "@/service/problemService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Code2, Swords, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminSingleProblemPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  
  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params?.slug) return;

    async function fetchProblem() {
      try {
        const res = await problemService.getProblemBySlug(params.slug as string);
        setProblem(res.problem);
      } catch (err) {
        setError((err as Error).message || "Failed to load problem details");
      } finally {
        setLoading(false);
      }
    }
    fetchProblem();
  }, [params?.slug]);

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center h-[50vh] text-muted-foreground animate-pulse">
        <Code2 className="w-12 h-12 mb-4 opacity-50" />
        <p>Loading problem data...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="p-10 max-w-4xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 flex flex-col items-center text-red-400">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error || "Problem not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-4">
        <Link href="/admin/view" className="w-fit">
          <Button variant="ghost" className="text-zinc-400 hover:text-white pl-0 hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{problem.name}</h1>
            <div className="flex items-center gap-3 mt-3">
              <Badge variant="outline" className={`
                ${problem.difficulty === 'easy' ? 'border-green-500/50 text-green-400' : ''}
                ${problem.difficulty === 'medium' ? 'border-yellow-500/50 text-yellow-400' : ''}
                ${problem.difficulty === 'hard' ? 'border-red-500/50 text-red-400' : ''}
                uppercase text-xs font-bold tracking-wider px-3 py-1
              `}>
                {problem.difficulty}
              </Badge>
              <span className="text-zinc-500 font-mono text-sm">/{problem.slug}</span>
            </div>
          </div>
          <Button disabled className="bg-primary/50 text-white/50 cursor-not-allowed font-bold px-8 shadow-[0_0_15px_rgba(124,106,247,0.1)]">
            Edit Challenge (Coming Soon)
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-surface-lowest border border-white/5" style={{ height: "max-content" }}>
          <TabsTrigger value="details" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold tracking-wide uppercase text-xs sm:text-sm p-2">
            Details
          </TabsTrigger>
          <TabsTrigger value="moderators" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold tracking-wide uppercase text-xs sm:text-sm p-2">
            Moderators ({problem.moderators?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="testcases" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold tracking-wide uppercase text-xs sm:text-sm p-2 ">
            Test Cases ({problem.test_cases?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="space-y-6">
          <Card className="border-t-[3px] border-t-primary/50 bg-surface-lowest relative overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Code2 className="w-5 h-5 text-primary" /> Core Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-zinc-200 bg-background/50 p-4 rounded-md border border-white/5">{problem.description || "No description provided."}</p>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Problem Statement</h3>
                <div className="text-zinc-200 bg-background/50 p-4 rounded-md border border-white/5 font-mono text-sm whitespace-pre-wrap">
                  {problem.problem_statement}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Input Format</h3>
                  <div className="text-zinc-200 bg-background/50 p-4 rounded-md border border-white/5 text-sm whitespace-pre-wrap">
                    {problem.input_format}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Output Format</h3>
                  <div className="text-zinc-200 bg-background/50 p-4 rounded-md border border-white/5 text-sm whitespace-pre-wrap">
                    {problem.output_format}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Constraints</h3>
                <div className="text-zinc-200 bg-background/50 p-4 rounded-md border border-white/5 font-mono text-sm whitespace-pre-wrap">
                  {problem.constraints || "None."}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MODERATORS TAB */}
        <TabsContent value="moderators">
          <Card className="border-t-[3px] border-t-secondary/50 bg-surface-lowest relative overflow-hidden min-h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="w-5 h-5 text-secondary" /> Assigned Moderators
              </CardTitle>
              <CardDescription>
                Users with permissions to edit this challenge and view blind submissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {problem.moderators && problem.moderators.length > 0 ? (
                <div className="border border-white/10 rounded-md overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-surface-highest">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white font-bold w-12">#</TableHead>
                        <TableHead className="text-white font-bold">Username</TableHead>
                        <TableHead className="text-white font-bold">Email Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {problem.moderators.map((mod, idx) => (
                        <TableRow key={mod.id} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="text-zinc-500 font-mono text-xs">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-white">{mod.username}</TableCell>
                          <TableCell className="text-zinc-400">{mod.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-md bg-background/50">
                  <Users className="w-12 h-12 mb-3 opacity-20" />
                  <p>No moderators assigned to this problem.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEST CASES TAB */}
        <TabsContent value="testcases">
          <Card className="border-t-[3px] border-t-platinum/50 bg-surface-lowest relative overflow-hidden min-h-[400px]">
             <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Swords className="w-5 h-5 text-platinum" /> Evaluation Engine
              </CardTitle>
              <CardDescription className="mt-1">
                Automated test cases tied to this problem.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {problem.test_cases && problem.test_cases.length > 0 ? (
                <div className="border border-white/10 rounded-md overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-surface-highest">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white font-bold w-16">#</TableHead>
                        <TableHead className="text-white font-bold max-w-[200px]">Input</TableHead>
                        <TableHead className="text-white font-bold max-w-[200px]">Output</TableHead>
                        <TableHead className="text-white font-bold w-24">Type</TableHead>
                        <TableHead className="text-white font-bold w-24">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {problem.test_cases.map((tc, idx) => (
                        <TableRow key={idx} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium text-zinc-400">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs text-zinc-300 whitespace-pre-wrap break-all max-w-[200px]">
                            {tc.input}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-zinc-300 whitespace-pre-wrap break-all max-w-[200px]">
                            {tc.output}
                          </TableCell>
                          <TableCell>
                            {tc.is_example ? (
                              <span className="text-[10px] uppercase font-bold text-platinum px-2 py-1 bg-platinum/10 rounded-full">Example</span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-1 bg-white/5 rounded-full">Private</span>
                            )}
                          </TableCell>
                          <TableCell className="text-platinum font-bold">{tc.points}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-white/10 rounded-md bg-background/50">
                  <Code2 className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-lg">No test cases configured.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
