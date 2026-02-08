
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from 'next-themes';
import MoodQuestionnaire, { moodQuestions } from '../components/MoodQuestionnaire';
import MoodGraph from '../components/MoodGraph';
import ReportGenerator from '../components/ReportGenerator';
import TriggerSelector from '../components/TriggerSelector';
import AdminDashboard from '../components/AdminDashboard';
import EmotionalJournal from '../components/EmotionalJournal';
import ThoughtRecord from '../components/ThoughtRecord';
import Auth from '../components/Auth';
import { MoodEntry, JournalEntry, ThoughtRecord as ThoughtRecordType } from '../types';
import { Moon, Sun, Loader2, LogOut, Send, ShieldAlert, BookText, BrainCircuit } from 'lucide-react';
import {
  fetchEntries, saveEntry,
  fetchJournal, saveJournal,
  fetchThoughtRecords, saveThoughtRecord
} from '../lib/googleSheets';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

const Index = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [thoughtRecords, setThoughtRecords] = useState<ThoughtRecordType[]>([]);

  const [activeTab, setActiveTab] = useState("track");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [answers, setAnswers] = useState<number[]>(new Array(5).fill(5));
  const [user, setUser] = useState<{ username: string, fullName: string, role: string } | null>(null);
  const [adminData, setAdminData] = useState<{
    entries: any[],
    users: any[],
    journalEntries: JournalEntry[],
    thoughtRecords: ThoughtRecordType[]
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { setTheme, theme } = useTheme();
  const { toast } = useToast();

  // Auth check and Data loading
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const savedUsername = localStorage.getItem('username');
    const savedFullName = localStorage.getItem('fullName');
    const savedRole = localStorage.getItem('role') || 'user';

    if (authStatus && savedUsername && savedFullName) {
      const activeUser = { username: savedUsername, fullName: savedFullName, role: savedRole };
      setUser(activeUser);
      loadAllData(activeUser.username, savedRole);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadAllData = async (username: string, role: string) => {
    setIsLoading(true);
    try {
      const [moods, journal, thoughts] = await Promise.all([
        fetchEntries(username),
        fetchJournal(username),
        fetchThoughtRecords(username)
      ]);
      setMoodEntries(moods);
      setJournalEntries(journal);
      setThoughtRecords(thoughts);

      if (role === 'admin') await loadAdminData();
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Could not fetch your logs. Check connectivity.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const response = await fetch('/api/mood-sync?action=admin_data');
      if (response.ok) {
        const data = await response.json();
        setAdminData(data);
      }
    } catch (e) {
      console.error("Admin data fetch error:", e);
    }
  };

  const handleAuthenticated = (authenticatedUser: { username: string, fullName: string, role: string }) => {
    setUser(authenticatedUser);
    loadAllData(authenticatedUser.username, authenticatedUser.role);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setMoodEntries([]);
    setJournalEntries([]);
    setThoughtRecords([]);
    setAdminData(null);
    setActiveTab("track");
  };

  const handleMoodSubmit = async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    const overallScore = parseFloat((answers.reduce((sum, val) => sum + val, 0) / answers.length).toFixed(1));

    const entry: MoodEntry = {
      date: new Date().toISOString(),
      answers: answers.map((value, index) => ({
        questionId: moodQuestions[index].id,
        value
      })),
      overallScore,
      triggers: selectedTriggers
    };

    setMoodEntries(prev => [...prev, entry]);
    setSelectedTriggers([]);
    setAnswers(new Array(5).fill(5));
    setActiveTab("history");

    const success = await saveEntry(entry, user.username);
    if (success) {
      toast({ title: "Logged Successfully", description: "Your mood log has been saved." });
      if (user.role === 'admin') loadAdminData();
    }
    setIsSubmitting(false);
  };

  const handleJournalSave = async (content: string) => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    const entry: JournalEntry = {
      username: user.username,
      date: new Date().toISOString(),
      content,
      dayNumber: journalEntries.length + 1
    };

    setJournalEntries(prev => [...prev, entry]);
    const success = await saveJournal(entry);

    if (success) {
      toast({ title: "Journal Saved", description: "Your thoughts have been safely recorded." });
    }
    setIsSubmitting(false);
  };

  const handleThoughtRecordSave = async (recordData: Omit<ThoughtRecordType, 'username' | 'date' | 'dayNumber'>) => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    const record: ThoughtRecordType = {
      ...recordData,
      username: user.username,
      date: new Date().toISOString(),
      dayNumber: thoughtRecords.length + 1
    };

    setThoughtRecords(prev => [...prev, record]);
    const success = await saveThoughtRecord(record);

    if (success) {
      toast({ title: "Thought Record Saved", description: "This challenge has been logged." });
    }
    setIsSubmitting(false);
  };

  const handleAnswerChange = (index: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getLastUpdateInfo = () => {
    if (moodEntries.length === 0) return { last: 'Never', next: 'Today' };

    const lastEntry = [...moodEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const lastDate = new Date(lastEntry.date);
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);

    return {
      last: format(lastDate, 'MMM d, h:mm a'),
      next: format(nextDate, 'MMM d, yyyy')
    };
  };

  const updateStatus = getLastUpdateInfo();

  if (!user) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent to-white dark:from-primary/20 dark:to-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading {user.fullName}'s MoodSphere...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-white dark:from-primary/20 dark:to-background transition-colors duration-300">
      <div className="containe max-w-5xl pt-6 md:pt-10 pb-12 md:pb-20 px-4 mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
          <div className="text-left font-sans">
            <h1 className="text-2xl md:text-4xl font-black text-primary mb-1 md:mb-2 tracking-tight text-shadow-sm">MoodSphere</h1>
            <div className="space-y-1">
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                Hello, <span className="font-bold text-primary">{user.fullName}</span> 👋
                {user.role === 'admin' && <Badge className="bg-primary/20 text-primary border-none px-2 py-0 h-5 text-[10px]">ADMIN</Badge>}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <p className="text-[10px] md:text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  LAST UPDATED: <span className="text-primary/70">{updateStatus.last}</span>
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  NEXT UPDATE DUE: <span className="text-primary/70">{updateStatus.next}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-full shadow-md border border-white/20">
              <Sun className="h-4 w-4 text-yellow-500" />
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-primary/80" />
              <Moon className="h-4 w-4 text-indigo-300 dark:text-indigo-400" />
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${user.role === 'admin' ? 'grid-cols-6' : 'grid-cols-5'} mb-8 md:mb-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-white/10 overflow-x-auto`}>
            <TabsTrigger value="track" className="rounded-xl py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold">Track</TabsTrigger>
            <TabsTrigger value="journal" className="rounded-xl py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold flex gap-2"><BookText className="h-4 w-4" /> Journal</TabsTrigger>
            <TabsTrigger value="thoughts" className="rounded-xl py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold flex gap-2"><BrainCircuit className="h-4 w-4" /> CBT</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold">History</TabsTrigger>
            <TabsTrigger value="insights" className="rounded-xl py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold">Insights</TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="admin" className="rounded-xl py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold flex gap-1"><ShieldAlert className="h-4 w-4" /> Admin</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="track" className="mt-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
              <div className="w-full md:w-3/4"><TriggerSelector onSelectTriggers={setSelectedTriggers} selectedTriggers={selectedTriggers} /></div>
              <div className="w-full md:w-1/4 flex flex-col gap-2">
                <Button onClick={handleMoodSubmit} disabled={isSubmitting} size="lg" className="w-full shadow-lg py-8 text-lg font-black uppercase tracking-tighter">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Submit Log
                </Button>
              </div>
            </div>
            <MoodQuestionnaire answers={answers} onAnswerChange={handleAnswerChange} />
          </TabsContent>

          <TabsContent value="journal" className="mt-4">
            <EmotionalJournal entries={journalEntries} onSave={handleJournalSave} isSubmitting={isSubmitting} />
          </TabsContent>

          <TabsContent value="thoughts" className="mt-4">
            <ThoughtRecord records={thoughtRecords} onSave={handleThoughtRecordSave} isSubmitting={isSubmitting} />
          </TabsContent>

          <TabsContent value="history" className="mt-4 animate-in fade-in duration-500">
            <Card className="border-primary/10 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm glass-card overflow-hidden">
              <CardContent className="pt-8 px-2 md:px-6">
                {moodEntries.length > 0 ? <MoodGraph data={moodEntries} /> : <div className="text-center py-20 text-muted-foreground italic">Your emotional journey starts here.</div>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="mt-4 animate-in fade-in duration-500">
            <Card className="border-primary/10 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm glass-card overflow-hidden">
              <CardContent className="pt-8 px-4 md:px-8">
                {moodEntries.length > 0 ? <ReportGenerator entries={moodEntries} /> : <div className="text-center py-20 text-muted-foreground italic">Insights will appear after your first check-in.</div>}
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === 'admin' && adminData && (
            <TabsContent value="admin" className="mt-4">
              <AdminDashboard
                allEntries={adminData.entries}
                allUsers={adminData.users}
                journalEntries={adminData.journalEntries}
                thoughtRecords={adminData.thoughtRecords}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
