"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { problemService, ProblemResponse } from "@/service/problemService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Code2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import Link from "next/link";

function AdminViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page") || "1";
  const limitParam = searchParams.get("limit") || "10";

  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const page = parseInt(pageParam, 10);
  const limit = parseInt(limitParam, 10);

  useEffect(() => {
    async function fetchProblems() {
      setLoading(true);
      setError("");
      try {
        const res = await problemService.getAllProblems(page, limit);
        setProblems(res.problems || []);
      } catch (err) {
        setError((err as Error).message || "Failed to fetch problems");
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, [page, limit]);

  const handleNext = () => {
    router.push(`/admin/view?page=${page + 1}&limit=${limit}`);
  };

  const handlePrev = () => {
    if (page > 1) {
      router.push(`/admin/view?page=${page - 1}&limit=${limit}`);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Challenge Library</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage and view deployed problems.</p>
        </div>
        <Link href="/admin/create">
          <Button size="lg" className="bg-primary text-white hover:bg-primary/90 font-bold px-8 shadow-[0_0_15px_rgba(124,106,247,0.3)] hover:scale-105 transition-all">
            + New Challenge
          </Button>
        </Link>
      </div>

      <Card className="border-t-[3px] border-t-primary/50 bg-surface-lowest relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Code2 className="w-5 h-5 text-primary" /> Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12 text-muted-foreground">Loading challenges...</div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
              {error}
            </div>
          ) : problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border border-white/5 border-dashed rounded-md bg-white/5">
              <p>No challenges found for this page.</p>
            </div>
          ) : (
            <div className="border border-white/10 rounded-md overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-surface-highest">
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white font-bold">Name</TableHead>
                    <TableHead className="text-white font-bold">Difficulty</TableHead>
                    <TableHead className="text-white font-bold">Slug</TableHead>
                    <TableHead className="text-right text-white font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problems.map((prob) => (
                    <TableRow key={prob.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-white">{prob.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`
                          ${prob.difficulty === 'easy' ? 'border-green-500/50 text-green-400' : ''}
                          ${prob.difficulty === 'medium' ? 'border-yellow-500/50 text-yellow-400' : ''}
                          ${prob.difficulty === 'hard' ? 'border-red-500/50 text-red-400' : ''}
                          uppercase text-[10px] font-bold tracking-wider
                        `}>
                          {prob.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 font-mono text-xs">{prob.slug}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/view/${prob.slug}`}>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/20">
                            <Eye className="w-4 h-4 mr-2" /> View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-6 flex justify-between items-center text-sm text-zinc-400">
            <div>
              Page {page} (Limit: {limit})
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={page <= 1} className="border-white/10 text-white hover:bg-white/10">
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext} disabled={problems.length < limit || loading} className="border-white/10 text-white hover:bg-white/10">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminViewPage() {
  return (
    <Suspense fallback={
      <div className="p-10 flex justify-center text-muted-foreground animate-pulse">
        Loading view dashboard...
      </div>
    }>
      <AdminViewContent />
    </Suspense>
  );
}
