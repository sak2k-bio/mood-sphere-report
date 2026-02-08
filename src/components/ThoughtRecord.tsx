
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ThoughtRecord as ThoughtRecordType } from '../types';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, ListFilter, Plus, Save, History, TrendingDown, Target, HelpCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ThoughtRecordProps {
    records: ThoughtRecordType[];
    onSave: (record: Omit<ThoughtRecordType, 'username' | 'date'>) => Promise<void>;
    isSubmitting: boolean;
}

const ThoughtRecord: React.FC<ThoughtRecordProps> = ({ records, onSave, isSubmitting }) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        situation: '',
        emotion: '',
        intensityScore: 50,
        automaticThought: '',
        evidenceFor: '',
        evidenceAgainst: '',
        alternativeThought: '',
        behaviorResponse: '',
        emotionAfterIntensity: 30
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
        setShowForm(false);
        setFormData({
            situation: '',
            emotion: '',
            intensityScore: 50,
            automaticThought: '',
            evidenceFor: '',
            evidenceAgainst: '',
            alternativeThought: '',
            behaviorResponse: '',
            emotionAfterIntensity: 30
        });
    };

    const Instruction = ({ title, content }: { title: string, content: string }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help opacity-40 hover:opacity-100 transition-opacity" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] p-2 bg-primary dark:bg-primary text-primary-foreground">
                    <p className="text-[10px] font-bold uppercase mb-1">{title}</p>
                    <p className="text-[11px] leading-tight">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Brain className="h-6 w-6" /> Thought Record
                    </h2>
                    <p className="text-muted-foreground text-sm">Challenge your negative thoughts and find balance.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"} className="font-bold">
                    {showForm ? 'Cancel' : (
                        <>
                            <Plus className="mr-2 h-4 w-4" /> New Record
                        </>
                    )}
                </Button>
            </div>

            {showForm && (
                <Card className="border-primary/20 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl animate-in zoom-in-95 duration-500 mb-12">
                    <CardHeader className="bg-primary/5 border-b border-primary/5 pb-4">
                        <CardTitle className="text-lg">Structured CBT Entry</CardTitle>
                        <CardDescription className="text-xs uppercase font-black tracking-widest text-primary/60">Complete when your mood is worsening</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Phase 1: The Situation */}
                                <div className="space-y-4 p-4 rounded-2xl bg-primary/[0.02] border border-primary/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="h-4 w-4 text-primary" />
                                        <h4 className="font-bold text-sm uppercase tracking-tight">Step 1: The Situation</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                            SITUATION <Instruction title="Situation" content="What happened? Who was there? Where were you? When did it occur?" />
                                        </label>
                                        <Input
                                            placeholder="e.g., At work during a meeting..."
                                            value={formData.situation}
                                            onChange={e => setFormData({ ...formData, situation: e.target.value })}
                                            className="bg-white/50 dark:bg-gray-900/50"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground">EMOTION</label>
                                            <Input
                                                placeholder="e.g., Anxious, Sad"
                                                value={formData.emotion}
                                                onChange={e => setFormData({ ...formData, emotion: e.target.value })}
                                                className="bg-white/50 dark:bg-gray-900/50"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground">INTENSITY ({formData.intensityScore}%)</label>
                                            <Slider
                                                value={[formData.intensityScore]}
                                                onValueChange={([val]) => setFormData({ ...formData, intensityScore: val })}
                                                max={100}
                                                step={1}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 2: Automatic Thought */}
                                <div className="space-y-4 p-4 rounded-2xl bg-destructive/[0.02] border border-destructive/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingDown className="h-4 w-4 text-destructive" />
                                        <h4 className="font-bold text-sm uppercase tracking-tight text-destructive/80">Step 2: Analysis</h4>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                            AUTOMATIC THOUGHT <Instruction title="Automatic Thought" content="What was going through your mind? What are you afraid might happen?" />
                                        </label>
                                        <Textarea
                                            placeholder="I'm going to fail at this task..."
                                            value={formData.automaticThought}
                                            onChange={e => setFormData({ ...formData, automaticThought: e.target.value })}
                                            className="bg-white/50 dark:bg-gray-900/50 h-24"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Phase 3: Evidence */}
                                <div className="space-y-4 p-4 rounded-2xl bg-amber/[0.02] border border-amber/10 md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                                EVIDENCE FOR <Instruction title="Evidence For" content="What facts support this thought? Avoid interpretations, stick to facts." />
                                            </label>
                                            <Textarea
                                                placeholder="I missed one deadline last month..."
                                                value={formData.evidenceFor}
                                                onChange={e => setFormData({ ...formData, evidenceFor: e.target.value })}
                                                className="bg-white/50 dark:bg-gray-900/50 h-20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                                EVIDENCE AGAINST <Instruction title="Evidence Against" content="What indicates the thought isn't 100% true? Past successes? Counter-evidence?" />
                                            </label>
                                            <Textarea
                                                placeholder="I have completed 95% of tasks early..."
                                                value={formData.evidenceAgainst}
                                                onChange={e => setFormData({ ...formData, evidenceAgainst: e.target.value })}
                                                className="bg-white/50 dark:bg-gray-900/50 h-20"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Phase 4: Resolution */}
                                <div className="space-y-4 p-4 rounded-2xl bg-green-500/[0.02] border border-green-500/10 md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                                    BALANCED THOUGHT <Instruction title="Balanced Thought" content="Based on all evidence, what is a more realistic way to view this?" />
                                                </label>
                                                <Textarea
                                                    placeholder="I may be under pressure, but I usually pull through..."
                                                    value={formData.alternativeThought}
                                                    onChange={e => setFormData({ ...formData, alternativeThought: e.target.value })}
                                                    className="bg-white/50 dark:bg-gray-900/50 h-20"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                                    BEHAVIOR/RESPONSE <Instruction title="Response" content="What will you do differently now? How will you handle the situation?" />
                                                </label>
                                                <Input
                                                    placeholder="I will take a 5 min break and then start..."
                                                    value={formData.behaviorResponse}
                                                    onChange={e => setFormData({ ...formData, behaviorResponse: e.target.value })}
                                                    className="bg-white/50 dark:bg-gray-900/50"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center space-y-4 bg-green-500/[0.05] p-6 rounded-2xl">
                                            <label className="text-sm font-black text-green-600 dark:text-green-400 text-center uppercase tracking-tighter">
                                                Emotion Intensity After ({formData.emotionAfterIntensity}%)
                                            </label>
                                            <Slider
                                                value={[formData.emotionAfterIntensity]}
                                                onValueChange={([val]) => setFormData({ ...formData, emotionAfterIntensity: val })}
                                                max={100}
                                                step={1}
                                                className="py-4"
                                            />
                                            <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest opacity-60">
                                                Check back in to see the reduction!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-primary/5">
                                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Discard</Button>
                                <Button type="submit" className="px-10 font-black tracking-tight" disabled={isSubmitting}>
                                    {isSubmitting ? 'Syncing...' : 'Save Thought Record'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* History Table */}
            <Card className="border-primary/5 shadow-lg bg-white/40 dark:bg-gray-800/40 backdrop-blur-md overflow-hidden">
                <div className="p-6 bg-primary/[0.02] border-b border-primary/5 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <History className="h-4 w-4" /> Historical Records
                    </h3>
                    <Badge variant="outline">{records.length} Records</Badge>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white/50 dark:bg-gray-900/50">
                            <TableRow>
                                <TableHead className="w-[100px] text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Situation</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Emotion (Start/End)</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Automatic Thought</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Balanced View</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.length > 0 ? (
                                [...records].reverse().map((record, idx) => (
                                    <TableRow key={idx} className="group hover:bg-primary/[0.02] transition-colors">
                                        <TableCell className="text-xs font-medium">
                                            {format(new Date(record.date), 'MMM d, yy')}<br />
                                            <span className="text-[10px] text-muted-foreground opacity-60 font-mono">
                                                Log #{records.length - idx}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs font-semibold">{record.situation}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-black text-primary">{record.emotion}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-destructive">{record.intensityScore}%</span>
                                                    <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${record.intensityScore}%` }} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-green-500">{record.emotionAfterIntensity}%</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs italic text-muted-foreground max-w-[200px] truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                            "{record.automaticThought}"
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-primary">
                                            {record.alternativeThought}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                                        No thought records found. Start your first cognitive challenge!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};

export default ThoughtRecord;
