
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Activity, BookOpen, BrainCircuit, History, TrendingUp } from 'lucide-react';
import { MoodEntry, JournalEntry, ThoughtRecord } from '../types';
import { moodQuestions } from './MoodQuestionnaire';
import { format } from 'date-fns';

interface AdminDashboardProps {
    allEntries: any[];
    allUsers: { username: string, fullName: string, role: string }[];
    journalEntries?: JournalEntry[];
    thoughtRecords?: ThoughtRecord[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    allEntries,
    allUsers,
    journalEntries = [],
    thoughtRecords = []
}) => {

    const getUserStats = (username: string) => {
        const userEntries = allEntries.filter(e => e.Username === username);
        const userJournals = journalEntries.filter(e => e.username === username);
        const userThoughts = thoughtRecords.filter(e => e.username === username);

        const daysRecorded = userEntries.length;

        if (daysRecorded === 0 && userJournals.length === 0 && userThoughts.length === 0) return null;

        const lastMoodEntry = userEntries.length > 0
            ? [...userEntries].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0]
            : null;

        const lastJournal = userJournals.length > 0
            ? [...userJournals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            : null;

        const lastThought = userThoughts.length > 0
            ? [...userThoughts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            : null;

        const avgScore = daysRecorded > 0
            ? (userEntries.reduce((sum, e) => sum + parseFloat(e["Overall Score"]), 0) / daysRecorded).toFixed(1)
            : "N/A";

        // Get trigger frequency
        const triggerMap: Record<string, number> = {};
        userEntries.forEach(e => {
            const triggers = e.Triggers ? e.Triggers.split(', ') : [];
            triggers.forEach((t: string) => {
                triggerMap[t] = (triggerMap[t] || 0) + 1;
            });
        });

        const topTriggers = Object.entries(triggerMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);

        // Calculate Next Due
        let nextDue = 'Today';
        if (lastMoodEntry) {
            const nextDate = new Date(lastMoodEntry.Date);
            nextDate.setDate(nextDate.getDate() + 1);
            nextDue = format(nextDate, 'MMM d, yyyy');
        }

        return {
            daysRecorded,
            avgScore,
            lastMoodEntry,
            lastJournal,
            lastThought,
            journalCount: userJournals.length,
            thoughtCount: userThoughts.length,
            topTriggers,
            nextDue
        };
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Users className="h-6 w-6" /> Admin Overview
                    </h2>
                    <p className="text-muted-foreground">Bird's-eye view of all user activity and mental health logs</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className="px-4 py-1.5 text-xs font-bold bg-white/50 dark:bg-gray-800/50 border-primary/20">
                        {allUsers.length} Users
                    </Badge>
                    <Badge variant="outline" className="px-4 py-1.5 text-xs font-bold bg-white/50 dark:bg-gray-800/50 border-primary/20">
                        {allEntries.length} Mood Logs
                    </Badge>
                    <Badge variant="outline" className="px-4 py-1.5 text-xs font-bold bg-white/50 dark:bg-gray-800/50 border-primary/20">
                        {journalEntries.length} Journals
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allUsers.map((user) => {
                    const stats = getUserStats(user.username);

                    return (stats || user.role === 'admin') ? (
                        <Card key={user.username} className="overflow-hidden border-primary/10 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md group relative">
                            {user.role === 'admin' && (
                                <div className="absolute top-0 right-0 p-1">
                                    <Badge className="bg-primary/20 text-primary border-none text-[8px] px-1 py-0 uppercase">Staff</Badge>
                                </div>
                            )}
                            <CardHeader className="pb-2 bg-primary/[0.02] border-b border-primary/5">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{user.fullName}</CardTitle>
                                        <CardDescription className="text-[10px] font-mono uppercase tracking-tighter">ID: {user.username}</CardDescription>
                                    </div>
                                    <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="uppercase text-[9px] font-black h-5">
                                        {user.role}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {stats ? (
                                    <>
                                        {/* Main Stats Row */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-primary/5 rounded-xl p-2 text-center border border-primary/5">
                                                <p className="text-[8px] uppercase text-muted-foreground font-black mb-1">Avg</p>
                                                <p className="text-lg font-black text-primary leading-none">{stats.avgScore}</p>
                                            </div>
                                            <div className="bg-primary/5 rounded-xl p-2 text-center border border-primary/5">
                                                <p className="text-[8px] uppercase text-muted-foreground font-black mb-1">Moods</p>
                                                <p className="text-lg font-black text-primary leading-none">{stats.daysRecorded}</p>
                                            </div>
                                            <div className="bg-primary/5 rounded-xl p-2 text-center border border-primary/5">
                                                <p className="text-[8px] uppercase text-muted-foreground font-black mb-1">Journals</p>
                                                <p className="text-lg font-black text-primary leading-none">{stats.journalCount}</p>
                                            </div>
                                        </div>

                                        {/* Mood Trend */}
                                        {stats.lastMoodEntry && (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">
                                                        <Activity className="h-3 w-3" /> Last Mood Check
                                                    </p>
                                                    <span className="text-[9px] italic opacity-60">
                                                        {format(new Date(stats.lastMoodEntry.Date), 'MMM d')}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-primary/10 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full transition-all duration-1000"
                                                        style={{ width: `${(parseFloat(stats.lastMoodEntry["Overall Score"]) / 10) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Journal Preview */}
                                        {stats.lastJournal && (
                                            <div className="p-3 rounded-xl bg-accent/30 border border-primary/5 relative space-y-1">
                                                <p className="text-[10px] font-black text-primary/70 uppercase flex items-center gap-1">
                                                    <BookOpen className="h-3 w-3" /> Latest Journal
                                                </p>
                                                <p className="text-[11px] font-medium italic line-clamp-2 leading-relaxed text-muted-foreground">
                                                    "{stats.lastJournal.content}"
                                                </p>
                                            </div>
                                        )}

                                        {/* Thought Record Preview */}
                                        {stats.lastThought && (
                                            <div className="p-3 rounded-xl bg-destructive/[0.03] border border-destructive/10 space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] font-black text-destructive/70 uppercase flex items-center gap-1">
                                                        <BrainCircuit className="h-3 w-3" /> CBT Status
                                                    </p>
                                                    <Badge className="bg-destructive/10 text-destructive border-none text-[8px] h-4">
                                                        {stats.lastThought.emotion}
                                                    </Badge>
                                                </div>
                                                <p className="text-[11px] font-bold line-clamp-1 text-gray-700 dark:text-gray-300">
                                                    {stats.lastThought.situation}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-destructive" style={{ width: `${stats.lastThought.intensityScore}%` }} />
                                                    </div>
                                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500" style={{ width: `${stats.lastThought.emotionAfterIntensity}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Meta Footer */}
                                        <div className="pt-2 border-t border-primary/5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-muted-foreground/60">Last: {stats.lastMoodEntry ? format(new Date(stats.lastMoodEntry.Date), 'MMM d, p') : 'Never'}</span>
                                                <span className="text-primary/80">Next: {stats.nextDue}</span>
                                            </div>
                                            <History className="h-3 w-3 opacity-20" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-16 text-center space-y-3 opacity-30">
                                        <Calendar className="h-10 w-10 mx-auto text-muted-foreground" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Awaiting First Log</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : null;
                })}
            </div>
        </div>
    );
};

export default AdminDashboard;
