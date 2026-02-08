
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Activity, TrendingUp } from 'lucide-react';
import { MoodEntry } from '../types';
import { moodQuestions } from './MoodQuestionnaire';

interface AdminDashboardProps {
    allEntries: any[];
    allUsers: { username: string, fullName: string, role: string }[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ allEntries, allUsers }) => {

    const getUserStats = (username: string) => {
        const userEntries = allEntries.filter(e => e.Username === username);
        const daysRecorded = userEntries.length;

        if (daysRecorded === 0) return null;

        const lastEntry = [...userEntries].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())[0];
        const avgScore = (userEntries.reduce((sum, e) => sum + parseFloat(e["Overall Score"]), 0) / daysRecorded).toFixed(1);

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

        return {
            daysRecorded,
            avgScore,
            lastEntry,
            topTriggers
        };
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                        <Users className="h-6 w-6" /> Admin Overview
                    </h2>
                    <p className="text-muted-foreground">Bird's-eye view of all user activity</p>
                </div>
                <div className="flex gap-4">
                    <Badge variant="outline" className="px-4 py-1 text-sm bg-white/50 dark:bg-gray-800/50">
                        {allUsers.length} Registered Users
                    </Badge>
                    <Badge variant="outline" className="px-4 py-1 text-sm bg-white/50 dark:bg-gray-800/50">
                        {allEntries.length} Total Logs
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allUsers.map((user) => {
                    const stats = getUserStats(user.username);

                    return (stats || user.role === 'admin') ? (
                        <Card key={user.username} className="overflow-hidden border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm group">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{user.fullName}</CardTitle>
                                        <CardDescription className="text-xs">@{user.username}</CardDescription>
                                    </div>
                                    <Badge variant={user.role === 'admin' ? "default" : "secondary"} className="uppercase text-[10px] font-bold">
                                        {user.role}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {stats ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-2 text-center">
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Avg Score</p>
                                                <p className="text-xl font-black text-primary">{stats.avgScore}</p>
                                            </div>
                                            <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-2 text-center">
                                                <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Days Logged</p>
                                                <p className="text-xl font-black text-primary">{stats.daysRecorded}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                                <Activity className="h-3 w-3" /> Recent Performance
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {moodQuestions.map((q, idx) => {
                                                    const val = stats.lastEntry[`Q${idx + 1}: ${moodQuestions[idx].text.split(' ').includes('mood') ? 'Overall Mood' : moodQuestions[idx].text.split(' ').pop()?.replace('?', '')}`];
                                                    // Note: This mapping depends on the exact column names used in the sheet.
                                                    // For simplicity, let's just show the overall score of the last entry
                                                    return null;
                                                })}
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-primary h-full transition-all duration-500"
                                                        style={{ width: `${(parseFloat(stats.lastEntry["Overall Score"]) / 10) * 100}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground w-full text-right mt-1 italic">
                                                    Last Entry: {new Date(stats.lastEntry.Date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {stats.topTriggers.length > 0 && (
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-muted-foreground">Common Triggers</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {stats.topTriggers.map(t => (
                                                        <Badge key={t} variant="outline" className="text-[10px] bg-primary/5 border-primary/10">
                                                            {t}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="py-10 text-center space-y-2 opacity-50">
                                        <Calendar className="h-8 w-8 mx-auto text-muted-foreground" />
                                        <p className="text-xs italic">No entries recorded yet</p>
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
