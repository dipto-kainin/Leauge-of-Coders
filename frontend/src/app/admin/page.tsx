"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code2, Swords } from "lucide-react";

export default function AddProblemPage() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Terminal Upload</h1>
        <p className="text-muted-foreground mt-2 text-lg">Deploy a new challenge to the deathmatch queue.</p>
      </div>

      <Card className="border-t-[3px] border-t-primary/50 bg-surface-lowest backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-transparent group-hover:bg-primary/5 transition-colors duration-500 pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Code2 className="w-5 h-5 text-primary" /> Core Details
          </CardTitle>
          <CardDescription>
            Basic problem information to be displayed to contenders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">Problem Title</Label>
              <Input id="title" placeholder="e.g. Invert Binary Tree" className="bg-background border-white/10 text-white focus-visible:ring-primary/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-zinc-300">Base Difficulty</Label>
              <Select>
                <SelectTrigger className="bg-background border-white/10 text-white focus:ring-primary/50">
                  <SelectValue placeholder="Select rank tier" />
                </SelectTrigger>
                <SelectContent className="bg-surface-highest border-white/10 text-white">
                  <SelectItem value="iron" className="focus:bg-white/10 focus:text-white cursor-pointer">Iron & Bronze</SelectItem>
                  <SelectItem value="silver" className="focus:bg-white/10 focus:text-white cursor-pointer">Silver & Gold</SelectItem>
                  <SelectItem value="diamond" className="focus:bg-white/10 focus:text-white cursor-pointer">Platinum & Diamond</SelectItem>
                  <SelectItem value="radiant" className="focus:bg-white/10 focus:text-white cursor-pointer">Ascendant & Radiant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-300">Problem Description (Markdown)</Label>
            <Textarea 
              id="description" 
              placeholder="Explain the rules of engagement..." 
              className="min-h-[150px] bg-background border-white/10 text-white resize-y font-mono text-sm focus-visible:ring-primary/50" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="constraints" className="text-zinc-300">Constraints</Label>
            <Textarea 
              id="constraints" 
              placeholder={"1 <= N <= 10^5\n-10^9 <= array[i] <= 10^9"} 
              className="min-h-[80px] bg-background border-white/10 text-white resize-y font-mono text-sm focus-visible:ring-primary/50" 
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-t-[3px] border-t-secondary/50 bg-surface-lowest relative overflow-hidden group">
         <div className="absolute inset-0 bg-transparent group-hover:bg-secondary/5 transition-colors duration-500 pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Swords className="w-5 h-5 text-secondary" /> Test Engine Configuration
          </CardTitle>
          <CardDescription>
            Provide execution rules and evaluation test cases.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="functionName" className="text-zinc-300">Target Function Name</Label>
            <Input id="functionName" placeholder="e.g. invertTree" className="bg-background border-white/10 text-white font-mono focus-visible:ring-secondary/50" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
             <div className="space-y-2">
              <Label className="text-zinc-300">Input Signature (List of types)</Label>
              <Input placeholder="e.g. int[], int" className="bg-background border-white/10 text-white font-mono focus-visible:ring-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Output Type</Label>
              <Input placeholder="e.g. int[]" className="bg-background border-white/10 text-white font-mono focus-visible:ring-secondary/50" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Sample Test Case (JSON format)</Label>
            <Textarea 
              placeholder='{"inputs": [[1,2,3]], "expected": [3,2,1]}' 
              className="min-h-[120px] bg-background border-white/10 text-white resize-y font-mono text-sm focus-visible:ring-secondary/50" 
            />
          </div>
        </CardContent>
        <CardFooter className="bg-background/50 border-t border-white/5 py-4 px-6 flex justify-end">
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90 font-bold px-8 shadow-[0_0_15px_rgba(124,106,247,0.3)] hover:scale-105 transition-all">
               Deploy Challenge
            </Button>
        </CardFooter>
      </Card>

    </div>
  );
}
