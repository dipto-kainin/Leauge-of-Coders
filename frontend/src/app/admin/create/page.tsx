"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Code2, Swords, Users, ShieldAlert, Plus, Trash2, CheckCircle2 } from "lucide-react";

import { problemService, CreateProblemRequest, TestCaseRequest } from "@/service/problemService";

export default function AdminPage() {
  // Core Information
  const [name, setName] = useState("");
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  const [difficulty, setDifficulty] = useState("");
  const [description, setDescription] = useState("");
  const [statement, setStatement] = useState("");
  const [inputFormat, setInputFormat] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [constraints, setConstraints] = useState("");

  // Moderators
  const [moderators, setModerators] = useState<string[]>([]);
  const [modEmail, setModEmail] = useState("");

  // Test Cases
  const [testCases, setTestCases] = useState<TestCaseRequest[]>([]);
  const [tcInput, setTcInput] = useState("");
  const [tcOutput, setTcOutput] = useState("");
  const [tcPoints, setTcPoints] = useState("");
  const [tcIsExample, setTcIsExample] = useState(false);
  const [isTcModalOpen, setIsTcModalOpen] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleAddMod = () => {
    if (modEmail && !moderators.includes(modEmail)) {
      setModerators([...moderators, modEmail]);
      setModEmail("");
    }
  };

  const handleRemoveMod = (email: string) => {
    setModerators(moderators.filter(m => m !== email));
  };

  const handleAddTestCase = () => {
    if (tcInput && tcOutput && tcPoints) {
      setTestCases([
        ...testCases, 
        { input: tcInput, output: tcOutput, points: Number(tcPoints), is_example: tcIsExample }
      ]);
      setTcInput("");
      setTcOutput("");
      setTcPoints("");
      setTcIsExample(false);
      setIsTcModalOpen(false);
    }
  };

  const handleRemoveTestCase = (index: number) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleDeploy = async () => {
    setSubmitError("");
    setSubmitSuccess(false);

    if (!name || !difficulty || !statement || !inputFormat || !outputFormat) {
      setSubmitError("Please fill in all required fields (Name, Difficulty, Statement, Input/Output formats).");
      return;
    }

    if (testCases.length === 0) {
      setSubmitError("At least one test case is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateProblemRequest = {
        name,
        difficulty,
        description,
        problem_statement: statement,
        input_format: inputFormat,
        output_format: outputFormat,
        constraints,
        moderator_emails: moderators,
        test_cases: testCases,
      };

      await problemService.createProblem(payload);
      setSubmitSuccess(true);
      
      // Optionally reset form if desired
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      setSubmitError((err as Error).message || "Failed to deploy challenge.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Challenge Studio</h1>
          <p className="text-muted-foreground mt-2 text-lg">Create and configure problems for the arena.</p>
        </div>
        <Button 
          onClick={handleDeploy} 
          disabled={isSubmitting}
          size="lg" 
          className="bg-primary text-white hover:bg-primary/90 font-bold px-8 shadow-[0_0_15px_rgba(124,106,247,0.3)] transition-all"
        >
          {isSubmitting ? "Deploying..." : "Deploy Challenge"}
        </Button>
      </div>

      {submitError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md">
          {submitError}
        </div>
      )}
      {submitSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Challenge successfully deployed to the arena!
        </div>
      )}

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-surface-lowest border border-white/5" style={{ height: "max-content" }}>
          <TabsTrigger value="details" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold tracking-wide uppercase text-xs sm:text-sm p-2">
            Details
          </TabsTrigger>
          <TabsTrigger value="moderators" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold tracking-wide uppercase text-xs sm:text-sm p-2">
            Moderators
          </TabsTrigger>
          <TabsTrigger value="testcases" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-bold tracking-wide uppercase text-xs sm:text-sm p-2 ">
            Test Cases
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
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300">Name of Challenge</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Array Reversal"
                    className="bg-background border-white/10 text-white focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-zinc-300">Challenge Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger className="bg-background border-white/10 text-white focus:ring-primary/50">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-highest border-white/10 text-white">
                      <SelectItem value="easy" className="focus:bg-white/10 focus:text-white cursor-pointer">Easy (Iron / Bronze)</SelectItem>
                      <SelectItem value="medium" className="focus:bg-white/10 focus:text-white cursor-pointer">Medium (Silver / Gold)</SelectItem>
                      <SelectItem value="hard" className="focus:bg-white/10 focus:text-white cursor-pointer">Hard (Diamond / Ascendant)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-zinc-300">Slug (Auto-generated)</Label>
                <Input
                  id="slug"
                  value={slug}
                  readOnly
                  className="bg-background border-white/10 text-muted-foreground focus-visible:ring-primary/50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-300">Description</Label>
                <Textarea 
                  id="description" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of the challenge..." 
                  className="min-h-[80px] bg-background border-white/10 text-white resize-y text-sm focus-visible:ring-primary/50" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statement" className="text-zinc-300">Problem Statement</Label>
                <Textarea 
                  id="statement" 
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Full markdown problem statement..." 
                  className="min-h-[150px] bg-background border-white/10 text-white resize-y font-mono text-sm focus-visible:ring-primary/50" 
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="input-format" className="text-zinc-300">Input Format</Label>
                  <Textarea 
                    id="input-format" 
                    value={inputFormat}
                    onChange={(e) => setInputFormat(e.target.value)}
                    placeholder="Describe the expected input..." 
                    className="min-h-[100px] bg-background border-white/10 text-white resize-y text-sm focus-visible:ring-primary/50" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="output-format" className="text-zinc-300">Output Format</Label>
                  <Textarea 
                    id="output-format" 
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    placeholder="Describe what should be printed or returned..." 
                    className="min-h-[100px] bg-background border-white/10 text-white resize-y text-sm focus-visible:ring-primary/50" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="constraints" className="text-zinc-300">Constraints</Label>
                <Textarea
                  id="constraints"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder={"1 <= N <= 10^5"}
                  className="min-h-[80px] bg-background border-white/10 text-white resize-y font-mono text-sm focus-visible:ring-primary/50"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MODERATORS TAB */}
        <TabsContent value="moderators">
          <Card className="border-t-[3px] border-t-secondary/50 bg-surface-lowest relative overflow-hidden min-h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="w-5 h-5 text-secondary" /> Add Moderators
              </CardTitle>
              <CardDescription>
                Moderators have full permissions to edit this challenge and view blind submissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-4 max-w-xl">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="mod-email" className="text-zinc-300">Moderator Email</Label>
                  <Input
                    id="mod-email"
                    value={modEmail}
                    onChange={(e) => setModEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="bg-background border-white/10 text-white focus-visible:ring-secondary/50"
                  />
                </div>
                <Button onClick={handleAddMod} className="bg-secondary text-white hover:bg-secondary/90 shadow-[0_0_10px_rgba(67,97,238,0.3)]">
                  Add Mod
                </Button>
              </div>

              {moderators.length > 0 ? (
                <div className="border border-white/10 rounded-md overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-surface-highest">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white font-bold">Email Address</TableHead>
                        <TableHead className="text-right text-white font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {moderators.map((email) => (
                        <TableRow key={email} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium text-zinc-300">{email}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveMod(email)} className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-md bg-background/50">
                  <ShieldAlert className="w-12 h-12 mb-3 opacity-20" />
                  <p>No moderators assigned yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEST CASES TAB */}
        <TabsContent value="testcases">
          <Card className="border-t-[3px] border-t-platinum/50 bg-surface-lowest relative overflow-hidden min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Swords className="w-5 h-5 text-platinum" /> Evaluation Engine
                </CardTitle>
                <CardDescription className="mt-1">
                  Define the automated test cases used to evaluate submissions.
                </CardDescription>
              </div>
              <Dialog open={isTcModalOpen} onOpenChange={setIsTcModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-platinum text-black hover:bg-platinum/90 shadow-[0_0_15px_rgba(76,201,240,0.4)] font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Add Test Case
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] border-white/10 bg-surface-lowest backdrop-blur-xl">
                  <DialogHeader>
                    <DialogTitle className="text-white text-xl">Add New Test Case</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Specify the exact standard input and expected output.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tc-input" className="text-zinc-300">Standard Input</Label>
                      <Textarea
                        id="tc-input"
                        value={tcInput}
                        onChange={(e) => setTcInput(e.target.value)}
                        placeholder="e.g. 5\n1 2 3 4 5"
                        className="min-h-[100px] bg-background border-white/10 text-white font-mono text-sm focus-visible:ring-platinum/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tc-output" className="text-zinc-300">Expected Output</Label>
                      <Textarea
                        id="tc-output"
                        value={tcOutput}
                        onChange={(e) => setTcOutput(e.target.value)}
                        placeholder="e.g. 15"
                        className="min-h-[80px] bg-background border-white/10 text-white font-mono text-sm focus-visible:ring-platinum/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tc-points" className="text-zinc-300">Points</Label>
                        <Input
                          id="tc-points"
                          type="number"
                          value={tcPoints}
                          onChange={(e) => setTcPoints(e.target.value)}
                          placeholder="e.g. 10"
                          className="bg-background border-white/10 text-white focus-visible:ring-platinum/50"
                        />
                      </div>
                      <div className="space-y-2 flex flex-col justify-end">
                        <Label className="flex items-center gap-2 cursor-pointer text-zinc-300 h-10 border border-white/10 px-3 rounded-md hover:bg-white/5 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={tcIsExample} 
                            onChange={(e) => setTcIsExample(e.target.checked)}
                            className="w-4 h-4 accent-platinum cursor-pointer"
                          />
                          Is Example Case?
                        </Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTcModalOpen(false)} className="border-white/10 text-white hover:bg-white/5">Cancel</Button>
                    <Button onClick={handleAddTestCase} className="bg-platinum text-black hover:bg-platinum/90 font-bold">Save Test Case</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {testCases.length > 0 ? (
                <div className="border border-white/10 rounded-md overflow-hidden bg-background">
                  <Table>
                    <TableHeader className="bg-surface-highest">
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white font-bold w-16">#</TableHead>
                        <TableHead className="text-white font-bold max-w-[200px]">Input Snippet</TableHead>
                        <TableHead className="text-white font-bold max-w-[200px]">Output Snippet</TableHead>
                        <TableHead className="text-white font-bold w-20">Type</TableHead>
                        <TableHead className="text-white font-bold w-20">Points</TableHead>
                        <TableHead className="text-right text-white font-bold w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testCases.map((tc, idx) => (
                        <TableRow key={idx} className="border-white/5 hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium text-zinc-400">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs text-zinc-300 truncate max-w-[200px]">{tc.input.length > 30 ? tc.input.substring(0, 30) + '...' : tc.input}</TableCell>
                          <TableCell className="font-mono text-xs text-zinc-300 truncate max-w-[200px]">{tc.output.length > 30 ? tc.output.substring(0, 30) + '...' : tc.output}</TableCell>
                          <TableCell>
                            {tc.is_example ? (
                              <span className="text-[10px] uppercase font-bold text-platinum px-2 py-1 bg-platinum/10 rounded-full">Example</span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-1 bg-white/5 rounded-full">Private</span>
                            )}
                          </TableCell>
                          <TableCell className="text-platinum font-bold">{tc.points}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveTestCase(idx)} className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10 h-8 w-8">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed border-white/10 rounded-md bg-background/50">
                  <Code2 className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-lg">No test cases configured.</p>
                  <p className="text-sm opacity-60">Add test cases to evaluate submissions.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
