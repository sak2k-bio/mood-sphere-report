
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
import MedicationTracker from '../components/MedicationTracker'; // Added
import {
  MoodEntry,
  JournalEntry,
  ThoughtRecord as ThoughtRecordType,
  MedicationPrescription, // Added
  MedicationLog // Added
} from '../types';
import { Moon, Sun, Loader2, LogOut, Send, ShieldAlert, ShieldCheck, BookText, BrainCircuit, Pill } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  fetchEntries, saveEntry,
  fetchJournal, saveJournal,
  fetchThoughtRecords, saveThoughtRecord,
  fetchPrescriptions, saveMedicationLog // Added fetchPrescriptions, saveMedicationLog
} from '../lib/googleSheets';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

const Index = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [thoughtRecords, setThoughtRecords] = useState<ThoughtRecordType[]>([]);
  const [prescriptions, setPrescriptions] = useState<MedicationPrescription[]>([]); // Added

  const [activeTab, setActiveTab] = useState("track");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [answers, setAnswers] = useState<number[]>(new Array(5).fill(5));
  const [user, setUser] = useState<{ username: string, fullName: string, role: string } | null>(null);
  const [adminData, setAdminData] = useState<{
    entries: any[],
    users: any[],
    journalEntries: JournalEntry[],
    thoughtRecords: ThoughtRecordType[],
    prescriptions: MedicationPrescription[], // Added
    medLogs: MedicationLog[] // Added
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
      if (role === 'admin') {
        const response = await fetch(`/api/mood-sync?action=admin_data&username=${username}`);
        if (response.ok) {
          const data = await response.json();
          setAdminData(data);
          // Also set personal data if admin is tracking themselves
          setMoodEntries(data.entries.filter((e: any) => e.Username === username).map((e: any) => ({
            date: e.Date,
            overallScore: parseFloat(e["Overall Score"]),
            triggers: e.Triggers ? e.Triggers.split(', ') : [],
            answers: []
          })));
          setJournalEntries(data.journalEntries.filter((e: any) => e.username === username));
          setThoughtRecords(data.thoughtRecords.filter((e: any) => e.username === username));
          setPrescriptions(data.prescriptions.filter((e: any) => e.username === username));
        }
      } else {
        const [moods, journal, thoughts, prescriptionsData] = await Promise.all([ // Added prescriptionsData
          fetchEntries(username),
          fetchJournal(username),
          fetchThoughtRecords(username),
          fetchPrescriptions(username) // Added fetchPrescriptions
        ]);
        setMoodEntries(moods);
        setJournalEntries(journal);
        setThoughtRecords(thoughts);
        setPrescriptions(prescriptionsData); // Added
      }
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

  const loadAdminData = async (adminUsername: string) => {
    try {
      const response = await fetch(`/api/mood-sync?action=admin_data&username=${adminUsername}`);
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
    setPrescriptions([]); // Added
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
      if (user.role === 'admin') loadAdminData(user.username);
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

  const handleLogMedication = async (medicationName: string) => { // Added
    if (!user || isSubmitting) return;
    setIsSubmitting(true);

    const logEntry: MedicationLog = {
      username: user.username,
      medicationName,
      timestamp: new Date().toISOString()
    };

    const success = await saveMedicationLog(logEntry);

    if (success) {
      toast({ title: "Medication Logged", description: `${medicationName} taken.` });
      // Optionally, refresh admin data if user is admin
      if (user.role === 'admin') loadAdminData(user.username);
    } else {
      toast({ title: "Error", description: "Failed to log medication.", variant: "destructive" });
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
          <p className="text-muted-foreground animate-pulse">Loading {user.fullName}'s Mood Sphere...</p>
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
            <div className="flex items-center gap-3 mb-1 md:mb-2">
              <h1 className="text-2xl md:text-4xl font-black text-primary tracking-tight text-shadow-sm">Mood Sphere</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help p-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                      <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white/95 dark:bg-gray-900/95 border-primary/20 p-4 max-w-[280px] rounded-2xl shadow-2xl">
                    <p className="text-xs font-bold leading-relaxed text-primary/80">
                      App data is <span className="text-green-600">completely secure</span> — end-to-end — and is only accessible to the consulting Psychiatrist/Therapist.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
          <TabsList className={`grid w-full ${user.role === 'admin' ? 'grid-cols-7' : 'grid-cols-6'} mb-8 md:mb-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-1 rounded-2xl shadow-inner border border-white/10 gap-0.5`}>
            <TabsTrigger value="track" className="rounded-xl py-2 px-0 text-[10px] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white font-semibold">Track</TabsTrigger>
            <TabsTrigger value="journal" className="rounded-xl py-2 px-0 text-[10px] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white font-semibold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2">
              <BookText className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Journal</span><span className="xs:hidden">Daily</span>
            </TabsTrigger>
            <TabsTrigger value="thoughts" className="rounded-xl py-2 px-0 text-[10px] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white font-semibold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2">
              <BrainCircuit className="h-3 w-3 sm:h-4 sm:w-4" /> CBT
            </TabsTrigger>
            <TabsTrigger value="medication" className="rounded-xl py-2 px-0 text-[10px] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white font-semibold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2">
              <Pill className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Medication</span><span className="xs:hidden">Meds</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl py-2 px-0 text-[10px] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white font-semibold">
              <span className="hidden xs:inline">History</span><span className="xs:hidden">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-xl py-2 px-0 text-[10px] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white font-semibold">
              <span className="hidden xs:inline">Insights</span><span className="xs:hidden">Data</span>
            </TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="admin" className="rounded-xl py-2 px-0 text-[10px] sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white font-semibold flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1">
                <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4" /> Admin
              </TabsTrigger>
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

          <TabsContent value="medication" className="mt-4"> {/* Added Medication Tab Content */}
            <MedicationTracker prescriptions={prescriptions} onLogMedication={handleLogMedication} isSubmitting={isSubmitting} />
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
                prescriptions={adminData.prescriptions} // Added
                medLogs={adminData.medLogs} // Added
                onRefresh={() => loadAdminData(user.username)}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
