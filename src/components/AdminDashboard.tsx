
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Users, Calendar, Activity, BookOpen, BrainCircuit, History,
    TrendingUp, ChevronRight, X, Clock, Filter, Pill, Search,
    ArrowDownAZ, ArrowUpAZ, AlertTriangle, UserMinus, ShieldAlert,
    Plus, Loader2
} from 'lucide-react';
import { MoodEntry, JournalEntry, ThoughtRecord, MedicationPrescription, MedicationLog } from '../types';
import { moodQuestions } from './MoodQuestionnaire';
import { format, isWithinInterval, subDays, startOfWeek, startOfMonth } from 'date-fns';
import MoodGraph from './MoodGraph';
import { addPrescription } from '../lib/googleSheets';
import { toast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AdminDashboardProps {
    allEntries: any[];
    allUsers: { username: string, fullName: string, role: string }[];
    journalEntries?: JournalEntry[];
    thoughtRecords?: ThoughtRecord[];
    prescriptions?: MedicationPrescription[];
    medLogs?: MedicationLog[];
    onRefresh?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    allEntries,
    allUsers,
    journalEntries = [],
    thoughtRecords = [],
    prescriptions = [],
    medLogs = [],
    onRefresh
}) => {
    // --- STATE ---
    const [searchQuery, setSearchQuery] = useState("");
    const [timeframe, setTimeframe] = useState<"all" | "week" | "month" | "today">("all");
    const [minMood, setMinMood] = useState(0);
    const [maxMood, setMaxMood] = useState(10);
    const [minEntries, setMinEntries] = useState(0);
    const [selectedTrigger, setSelectedTrigger] = useState("all");
    const [sortBy, setSortBy] = useState<"activity-desc" | "activity-asc" | "mood-desc" | "mood-asc">("activity-desc");
    const [onMedicationOnly, setOnMedicationOnly] = useState(false);
    const [clinicalFilter, setClinicalFilter] = useState<"none" | "burnout" | "isolation" | "decline" | "gap" | "slippage">("none");

    // --- HELPERS ---
    const mapToMoodEntry = (raw: any): MoodEntry => ({
        date: raw.Date,
        overallScore: parseFloat(raw["Overall Score"]),
        triggers: raw.Triggers ? raw.Triggers.split(', ') : [],
        answers: [
            { questionId: 1, value: parseFloat(raw["Q1: Overall Mood"]) },
            { questionId: 2, value: parseFloat(raw["Q2: Stress"]) },
            { questionId: 3, value: parseFloat(raw["Q3: Social"]) },
            { questionId: 4, value: parseFloat(raw["Q4: Energy"]) },
            { questionId: 5, value: parseFloat(raw["Q5: Satisfaction"]) },
        ]
    });

    const getUserStats = (username: string) => {
        // Filter by Timeframe first
        const now = new Date();
        const interval = timeframe === "today" ? { start: now, end: now }
            : timeframe === "week" ? { start: subDays(now, 7), end: now }
                : timeframe === "month" ? { start: subDays(now, 30), end: now }
                    : null;

        const dateFilter = (dateStr: string) => {
            if (!interval) return true;
            const date = new Date(dateStr);
            return isWithinInterval(date, interval);
        };

        const userEntries = allEntries.filter(e => e.Username === username && dateFilter(e.Date));
        const userJournals = journalEntries.filter(e => e.username === username && dateFilter(e.date));
        const userThoughts = thoughtRecords.filter(e => e.username === username && dateFilter(e.date));
        const userMeds = medLogs.filter(e => e.username === username && dateFilter(e.timestamp));
        const userPrescriptions = prescriptions.filter(e => e.username === username);

        const daysRecorded = userEntries.length;
        const totalActivity = daysRecorded + userJournals.length + userThoughts.length + userMeds.length;

        if (totalActivity === 0 && userPrescriptions.length === 0) return null;

        const sortedMoods = [...userEntries].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
        const lastMoodEntry = sortedMoods.length > 0 ? sortedMoods[sortedMoods.length - 1] : null;

        const avgScore = daysRecorded > 0
            ? parseFloat((userEntries.reduce((sum, e) => sum + parseFloat(e["Overall Score"]), 0) / daysRecorded).toFixed(1))
            : null;

        // Trigger mapping
        const triggerMap: Record<string, number> = {};
        userEntries.forEach(e => {
            const triggers = e.Triggers ? e.Triggers.split(', ') : [];
            triggers.forEach((t: string) => {
                triggerMap[t] = (triggerMap[t] || 0) + 1;
            });
        });

        // Clinical Pattern Detection
        const isBurnout = avgScore !== null && (
            userEntries.some(e => parseFloat(e["Q4: Energy"]) < 4 && parseFloat(e["Q2: Stress"]) < 4) // Low energy + High stress intensity
        );
        const isIsolated = avgScore !== null && (
            userEntries.filter(e => parseFloat(e["Q3: Social"]) < 4).length >= Math.ceil(daysRecorded * 0.5)
        );
        const isSlipping = lastMoodEntry ? (now.getTime() - new Date(lastMoodEntry.Date).getTime()) > 72 * 60 * 60 * 1000 : true;

        // --- Next Due ---
        let nextDue = 'Today';
        if (lastMoodEntry) {
            const nextDate = new Date(lastMoodEntry.Date);
            nextDate.setDate(nextDate.getDate() + 1);
            nextDue = format(nextDate, 'MMM d, yyyy');
        }

        return {
            daysRecorded,
            avgScore,
            totalActivity,
            lastMoodEntry,
            journalCount: userJournals.length,
            thoughtCount: userThoughts.length,
            medCount: userMeds.length,
            onMedication: userPrescriptions.length > 0,
            triggers: Object.keys(triggerMap),
            nextDue,
            allMoods: sortedMoods.map(mapToMoodEntry),
            allJournals: [...userJournals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            allThoughts: [...userThoughts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            allMedLogs: [...userMeds].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
            allPrescriptions: userPrescriptions,
            patterns: { burnout: isBurnout, isolation: isIsolated, slipping: isSlipping }
        };
    };

    // --- COMPUTED: FILTERED & SORTED USERS ---
    const filteredUsers = useMemo(() => {
        let filtered = allUsers.map(user => ({ ...user, stats: getUserStats(user.username) }));

        // Remove users with no stats if not admin
        filtered = filtered.filter(u => u.stats || u.role === 'admin');

        // 1. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(u => u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
        }

        // 2. Medication Filter
        if (onMedicationOnly) {
            filtered = filtered.filter(u => u.stats?.onMedication);
        }

        // 3. Mood/Entry Filters
        filtered = filtered.filter(u => {
            if (!u.stats) return true; // Admins with no data stay
            const moodMatch = u.stats.avgScore === null || (u.stats.avgScore >= minMood && u.stats.avgScore <= maxMood);
            const entryMatch = u.stats.daysRecorded >= minEntries;
            const triggerMatch = selectedTrigger === "all" || u.stats.triggers.includes(selectedTrigger);
            return moodMatch && entryMatch && triggerMatch;
        });

        // 4. High Yield Clinical Filters
        if (clinicalFilter !== "none") {
            filtered = filtered.filter(u => {
                if (!u.stats) return false;
                if (clinicalFilter === "burnout") return u.stats.patterns.burnout;
                if (clinicalFilter === "isolation") return u.stats.patterns.isolation;
                if (clinicalFilter === "slippage") return u.stats.patterns.slipping;
                if (clinicalFilter === "gap") return (u.stats.avgScore !== null && u.stats.avgScore < 5) && (u.stats.journalCount === 0 && u.stats.thoughtCount === 0);
                return true;
            });
        }

        // 5. Sorting
        filtered.sort((a, b) => {
            const aStats = a.stats;
            const bStats = b.stats;
            if (!aStats || !bStats) return 0;

            if (sortBy === "activity-desc") return bStats.totalActivity - aStats.totalActivity;
            if (sortBy === "activity-asc") return aStats.totalActivity - bStats.totalActivity;
            if (sortBy === "mood-desc") return (bStats.avgScore || 0) - (aStats.avgScore || 0);
            if (sortBy === "mood-asc") return (aStats.avgScore || 0) - (bStats.avgScore || 0);
            return 0;
        });

        return filtered;
    }, [allUsers, searchQuery, onMedicationOnly, minMood, maxMood, minEntries, selectedTrigger, sortBy, timeframe, clinicalFilter]);

    const allAvailableTriggers = useMemo(() => {
        const set = new Set<string>();
        allEntries.forEach(e => {
            if (e.Triggers) e.Triggers.split(', ').forEach((t: string) => set.add(t));
        });
        return Array.from(set).sort();
    }, [allEntries]);

    // --- HELPERS ---
    const safeFormat = (dateStr: string | undefined | null, formatStr: string) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'N/A';
            return format(date, formatStr);
        } catch (e) {
            return 'N/A';
        }
    };

    // --- MODAL COMPONENT ---
    const UserDetailModal = ({ user }: { user: any }) => {
        const stats = user.stats;
        const [isAddingMed, setIsAddingMed] = useState(false);
        const [newMedName, setNewMedName] = useState("");
        const [newMedDosage, setNewMedDosage] = useState("");
        const [isSubmitting, setIsSubmitting] = useState(false);

        if (!stats) return null;

        const handleAddPrescription = async () => {
            if (!newMedName || !newMedDosage) {
                toast({ title: "Missing details", description: "Please enter medication name and dosage.", variant: "destructive" });
                return;
            }

            setIsSubmitting(true);
            const success = await addPrescription({
                username: user.username,
                medicationName: newMedName,
                dosage: newMedDosage,
                status: 'Active'
            });

            if (success) {
                toast({ title: "Prescription Added", description: `Assigned ${newMedName} to ${user.fullName}.` });
                setNewMedName("");
                setNewMedDosage("");
                setIsAddingMed(false);
                if (onRefresh) onRefresh();
            } else {
                toast({ title: "Error", description: "Failed to add prescription.", variant: "destructive" });
            }
            setIsSubmitting(false);
        };

        return (
            <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl border-primary/20 shadow-2xl rounded-[2rem] sm:rounded-none">
                <DialogHeader className="p-5 md:p-8 bg-primary/5 border-b border-primary/10 relative">
                    <div className="flex justify-between items-center relative z-10">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl md:text-3xl font-black text-primary tracking-tighter leading-none">{user.fullName}</DialogTitle>
                            <DialogDescription className="font-mono text-[9px] md:text-[11px] uppercase tracking-[0.2em] font-black opacity-40 dark:opacity-70">
                                Electronic Health Record • @{user.username}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            {stats.onMedication && (
                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-2 md:px-3 py-1 font-black text-[8px] md:text-[10px] tracking-widest animate-pulse">
                                    ON MEDICATION
                                </Badge>
                            )}
                            <Badge variant="outline" className="px-2 md:px-3 py-1 font-black text-[8px] md:text-[10px] tracking-widest">{user.role}</Badge>
                        </div>
                    </div>
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-none" />
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-5 md:p-8 space-y-8 md:space-y-12 pb-20">
                        {/* 1. Clinical Overview */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/5 text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground/60 dark:text-foreground/70 mb-1">Avg Mood</p>
                                <p className="text-3xl font-black text-primary">{stats.avgScore || "N/A"}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/5 text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground/60 dark:text-foreground/70 mb-1">Engagements</p>
                                <p className="text-3xl font-black text-primary">{stats.totalActivity}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 text-center">
                                <p className="text-[10px] font-black uppercase text-green-600/60 dark:text-green-400/80 mb-1">CBT Active</p>
                                <p className="text-3xl font-black text-green-600 dark:text-green-400">{stats.thoughtCount}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-center">
                                <p className="text-[10px] font-black uppercase text-amber-600/60 dark:text-amber-400/80 mb-1">Meds Taken</p>
                                <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats.medCount}</p>
                            </div>
                        </div>

                        {/* 2. Mood Trends */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-black flex items-center gap-2 text-primary uppercase tracking-tight">
                                <Activity className="h-5 w-5" /> Biological Trends
                            </h3>
                            <Card className="p-2 lg:p-6 bg-white/50 border-primary/10 overflow-hidden shadow-inner">
                                <MoodGraph data={stats.allMoods} height={250} hideHeader />
                            </Card>
                        </section>

                        {/* 3. Medication & CBT (Clinical Data) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Medication Column */}
                            <div className="space-y-5">
                                <h4 className="text-sm font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
                                    <Pill className="h-4 w-4" /> Prescriptions & Adherence
                                </h4>

                                {isAddingMed ? (
                                    <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4 animate-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Medication Name</Label>
                                            <Input value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="e.g. Sertraline" className="rounded-xl border-primary/20" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Dosage & Schedule</Label>
                                            <Input value={newMedDosage} onChange={(e) => setNewMedDosage(e.target.value)} placeholder="e.g. 50mg Once Daily" className="rounded-xl border-primary/20" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleAddPrescription} disabled={isSubmitting} className="flex-1 rounded-xl font-black uppercase tracking-tighter h-11">
                                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assignment"}
                                            </Button>
                                            <Button variant="outline" onClick={() => setIsAddingMed(false)} className="rounded-xl font-black uppercase tracking-tighter h-11">Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button onClick={() => setIsAddingMed(true)} variant="outline" className="w-full border-dashed border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5 text-amber-600 rounded-2xl py-8 flex flex-col gap-1">
                                        <Plus className="h-5 w-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Add New Prescription</span>
                                    </Button>
                                )}

                                <div className="space-y-4">
                                    {stats.allPrescriptions.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2">
                                                {stats.allPrescriptions.map((p, i) => (
                                                    <Badge key={i} className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200">
                                                        {p.medicationName} ({p.dosage})
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                {stats.allMedLogs.map((l, i) => (
                                                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-500/5 text-xs">
                                                        <span className="font-bold">{l.medicationName}</span>
                                                        <span className="text-muted-foreground dark:text-foreground/60">{safeFormat(l.timestamp, 'MMM d, h:mm a')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-10 border-2 border-dashed border-primary/5 rounded-3xl text-center opacity-30 dark:opacity-60">
                                            <Pill className="h-8 w-8 mx-auto mb-2" />
                                            <p className="text-[10px] font-black uppercase">No Active Medications</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CBT Column */}
                            <div className="space-y-5">
                                <h4 className="text-sm font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                                    <BrainCircuit className="h-4 w-4" /> Cognitive Records
                                </h4>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {stats.allThoughts.map((t, i) => (
                                        <div key={i} className="p-5 rounded-3xl bg-destructive/[0.02] border border-destructive/5 space-y-4">
                                            <div className="flex justify-between">
                                                <Badge className="bg-destructive/10 text-destructive border-none text-[9px] uppercase font-black">{t.emotion}</Badge>
                                                <span className="text-[10px] text-muted-foreground dark:text-foreground/60 opacity-50 dark:opacity-80">{safeFormat(t.date, 'MMM d')}</span>
                                            </div>
                                            <p className="text-xs font-bold leading-tight line-clamp-2">"{t.situation}"</p>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1 flex-1 bg-destructive/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-destructive" style={{ width: `${t.intensityScore}%` }} />
                                                </div>
                                                <ChevronRight className="h-3 w-3 opacity-20" />
                                                <div className="h-1 flex-1 bg-green-500/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500" style={{ width: `${t.emotionAfterIntensity}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.allThoughts.length === 0 && <p className="text-[10px] text-center opacity-30 italic py-10">No CBT work recorded.</p>}
                                </div>
                            </div>
                        </div>

                        {/* 4. Qualitative Journals */}
                        <section className="space-y-5">
                            <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <BookOpen className="h-4 w-4" /> Emotional Journal Logs
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {stats.allJournals.map((j, i) => (
                                    <div key={i} className="p-6 rounded-3xl bg-primary/[0.03] border border-primary/5 space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40 dark:opacity-70">
                                            <span>Entry #{j.dayNumber || stats.allJournals.length - i}</span>
                                            <span>{safeFormat(j.date, 'MMM d, p')}</span>
                                        </div>
                                        <p className="text-sm italic font-medium leading-relaxed">"{j.content}"</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </ScrollArea>
            </DialogContent>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            {/* --- ADANCED FILTER HEADER --- */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl p-6 border border-primary/10 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 dark:opacity-80" />
                        <Input
                            placeholder="Search patients by name or ID..."
                            className="pl-12 py-6 rounded-2xl bg-white/50 dark:bg-gray-900/50 border-none shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="rounded-2xl h-12 px-6 gap-2 border-primary/10 bg-white/50 backdrop-blur font-bold">
                                    <Filter className="h-4 w-4" /> Triage Filters
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-6 rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-primary/10 shadow-2xl space-y-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase opacity-50 tracking-widest">Timeframe Scope</Label>
                                    <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
                                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Lifetime Records</SelectItem>
                                            <SelectItem value="today">Today Only</SelectItem>
                                            <SelectItem value="week">Past 7 Days</SelectItem>
                                            <SelectItem value="month">Past 30 Days</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase opacity-50 tracking-widest">Diagnostic Range: Mood ({minMood}-{maxMood})</Label>
                                    <Slider
                                        value={[minMood, maxMood]}
                                        max={10}
                                        step={0.5}
                                        onValueChange={([min, max]) => { setMinMood(min); setMaxMood(max); }}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase opacity-50 tracking-widest">Specific Trigger</Label>
                                    <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
                                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Triggers</SelectItem>
                                            {allAvailableTriggers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <Label className="font-bold text-sm">On Medication Only</Label>
                                    <Switch checked={onMedicationOnly} onCheckedChange={setOnMedicationOnly} />
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                            <SelectTrigger className="rounded-2xl h-12 w-[180px] border-primary/10 bg-white/50 backdrop-blur font-bold px-4">
                                <SelectValue placeholder="Sort Analysis" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="activity-desc">Most Active First</SelectItem>
                                <SelectItem value="activity-asc">Least Active First</SelectItem>
                                <SelectItem value="mood-desc">Highest Mood First</SelectItem>
                                <SelectItem value="mood-asc">Lowest Mood First</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* QUICK CLINICAL TAGS */}
                <div className="flex flex-wrap gap-2 pt-2">
                    <Badge
                        onClick={() => setClinicalFilter(clinicalFilter === "burnout" ? "none" : "burnout")}
                        className={`cursor-pointer px-4 py-1.5 rounded-full transition-all border-none ${clinicalFilter === "burnout" ? "bg-destructive text-white" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}
                    >
                        <ShieldAlert className="h-3 w-3 mr-2" /> Burnout Risk
                    </Badge>
                    <Badge
                        onClick={() => setClinicalFilter(clinicalFilter === "isolation" ? "none" : "isolation")}
                        className={`cursor-pointer px-4 py-1.5 rounded-full transition-all border-none ${clinicalFilter === "isolation" ? "bg-amber-500 text-white" : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"}`}
                    >
                        <UserMinus className="h-3 w-3 mr-2" /> Social Isolation
                    </Badge>
                    <Badge
                        onClick={() => setClinicalFilter(clinicalFilter === "slippage" ? "none" : "slippage")}
                        className={`cursor-pointer px-4 py-1.5 rounded-full transition-all border-none ${clinicalFilter === "slippage" ? "bg-indigo-500 text-white" : "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"}`}
                    >
                        <Clock className="h-3 w-3 mr-2" /> 72h+ Inactive
                    </Badge>
                    <Badge
                        onClick={() => setClinicalFilter(clinicalFilter === "gap" ? "none" : "gap")}
                        className={`cursor-pointer px-4 py-1.5 rounded-full transition-all border-none ${clinicalFilter === "gap" ? "bg-primary text-white" : "bg-primary/10 text-primary hover:bg-primary/20"}`}
                    >
                        <AlertTriangle className="h-3 w-3 mr-2" /> Therapy Gap
                    </Badge>
                    {clinicalFilter !== "none" && (
                        <Button variant="ghost" size="sm" onClick={() => setClinicalFilter("none")} className="h-8 text-[9px] font-black uppercase text-muted-foreground dark:text-foreground/60">Clear Patterns</Button>
                    )}
                </div>
            </div>

            {/* --- USER GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => {
                    const stats = user.stats;

                    return (
                        <Dialog key={user.username}>
                            <DialogTrigger asChild>
                                <Card className="overflow-hidden border-primary/10 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md group relative cursor-pointer hover:border-primary/40 active:scale-[0.98] rounded-3xl">
                                    {user.role === 'admin' && (
                                        <div className="absolute top-0 right-0 p-2">
                                            <Badge className="bg-primary/20 text-primary border-none text-[8px] px-1.5 py-0.5 uppercase tracking-tighter">STAFF</Badge>
                                        </div>
                                    )}
                                    <CardHeader className="pb-2 bg-primary/[0.02] border-b border-primary/5">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors tracking-tight">{user.fullName}</CardTitle>
                                                <div className="flex items-center gap-2">
                                                    <CardDescription className="text-[10px] font-mono uppercase tracking-tighter opacity-50 dark:opacity-80">@{user.username}</CardDescription>
                                                    {stats?.onMedication && <Pill className="h-3.5 w-3.5 text-amber-500 animate-pulse" />}
                                                </div>
                                            </div>
                                            <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="uppercase text-[9px] font-black px-2 h-5 tracking-widest border-none">
                                                {user.role}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        {stats ? (
                                            <>
                                                {/* Diagnostic Stats */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="bg-primary/5 rounded-2xl p-3 text-center border border-primary/5 group-hover:bg-primary/10 transition-colors">
                                                        <p className="text-[9px] uppercase text-muted-foreground font-black mb-1 opacity-50 dark:opacity-80">Avg</p>
                                                        <p className={`text-xl font-black leading-none ${(stats.avgScore || 0) < 5 ? 'text-destructive' : 'text-primary'}`}>{stats.avgScore || "N/A"}</p>
                                                    </div>
                                                    <div className="bg-primary/5 rounded-2xl p-3 text-center border border-primary/5">
                                                        <p className="text-[9px] uppercase text-muted-foreground font-black mb-1 opacity-50 dark:opacity-80">Moods</p>
                                                        <p className="text-xl font-black text-primary leading-none">{stats.daysRecorded}</p>
                                                    </div>
                                                    <div className="bg-primary/5 rounded-2xl p-3 text-center border border-primary/5">
                                                        <p className="text-[9px] uppercase text-muted-foreground font-black mb-1 opacity-50 dark:opacity-80">Total</p>
                                                        <p className="text-xl font-black text-primary leading-none">{stats.totalActivity}</p>
                                                    </div>
                                                </div>

                                                {/* Sparkline Trend */}
                                                {stats.allMoods.length > 0 && (
                                                    <div className="space-y-2">
                                                        <div className="flex items-baseline justify-between">
                                                            <p className="text-[9px] font-black text-muted-foreground/60 dark:text-foreground/70 uppercase tracking-widest">Trend</p>
                                                            {stats.patterns.slipping && <Badge variant="outline" className="text-[7px] text-destructive border-destructive/20 bg-destructive/5 font-black uppercase tracking-tighter h-4">Critical Slippage</Badge>}
                                                        </div>
                                                        <MoodGraph data={stats.allMoods} compact />
                                                    </div>
                                                )}

                                                {/* Detailed Meta Footer */}
                                                <div className="pt-4 border-t border-primary/5 flex justify-between items-end">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-muted-foreground/40 dark:text-foreground/60">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{stats.lastMoodEntry ? format(new Date(stats.lastMoodEntry.Date), 'MMM d, h:mm a') : 'No Records'}</span>
                                                        </div>
                                                        <p className="text-[10px] font-black text-primary/60 dark:text-primary uppercase tracking-wider">Next: {stats.nextDue}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex gap-1">
                                                            {stats.thoughtCount > 0 && <Badge className="h-2 w-2 rounded-full p-0 bg-destructive animate-pulse border-none shadow-none" />}
                                                            {stats.journalCount > 0 && <Badge className="h-2 w-2 rounded-full p-0 bg-primary border-none shadow-none" />}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Review</span>
                                                            <ChevronRight className="h-3 w-3" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="py-24 text-center space-y-4 opacity-20 dark:opacity-40">
                                                <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Clinical Record</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </DialogTrigger>
                            <UserDetailModal user={user} />
                        </Dialog>
                    );
                })}

                {filteredUsers.length === 0 && (
                    <div className="col-span-full py-40 text-center space-y-6 opacity-30">
                        <ShieldAlert className="h-16 w-16 mx-auto text-primary" />
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black uppercase tracking-widest">No Matches Found</h3>
                            <p className="text-sm font-medium">Try adjusting your triage filters or search query.</p>
                        </div>
                        <Button onClick={() => {
                            setSearchQuery(""); setTimeframe("all"); setMinMood(0); setMaxMood(10);
                            setSelectedTrigger("all"); setOnMedicationOnly(false); setClinicalFilter("none");
                        }} variant="outline" className="rounded-2xl px-8 border-primary/20">Reset All Filters</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
