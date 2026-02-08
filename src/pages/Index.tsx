
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useTheme } from 'next-themes';
import MoodQuestionnaire, { moodQuestions } from '../components/MoodQuestionnaire';
import MoodGraph from '../components/MoodGraph';
import ReportGenerator from '../components/ReportGenerator';
import TriggerSelector from '../components/TriggerSelector';
import AdminDashboard from '../components/AdminDashboard';
import Auth from '../components/Auth';
import { MoodEntry } from '../types';
import { Moon, Sun, Loader2, LogOut, Send, ShieldAlert } from 'lucide-react';
import { fetchEntries, saveEntry } from '../lib/googleSheets';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';

const Index = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [activeTab, setActiveTab] = useState("track");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [answers, setAnswers] = useState<number[]>(new Array(5).fill(5));
  const [user, setUser] = useState<{ username: string, fullName: string, role: string } | null>(null);
  const [adminData, setAdminData] = useState<{ entries: any[], users: any[] } | null>(null);
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
      loadData(activeUser.username);
      if (savedRole === 'admin') loadAdminData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadData = async (username: string) => {
    setIsLoading(true);
    try {
      const entries = await fetchEntries(username);
      setMoodEntries(entries);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Could not fetch entries. Check your internet connection.",
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
    loadData(authenticatedUser.username);
    if (authenticatedUser.role === 'admin') loadAdminData();
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    setUser(null);
    setMoodEntries([]);
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

    // Optimistic update
    setMoodEntries(prev => [...prev, entry]);

    // Reset state early for UX
    setSelectedTriggers([]);
    setAnswers(new Array(5).fill(5));
    setActiveTab("insights");

    // Sync to Google Sheets
    const success = await saveEntry(entry, user.username);
    if (!success) {
      toast({
        title: "Sync Warning",
        description: "Data saved locally but could not sync to Google Sheets.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Synced Successfully",
        description: "Your mood log has been saved.",
      });
      if (user.role === 'admin') loadAdminData(); // Refresh admin view
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
          <div className="text-left font-sans">
            <h1 className="text-2xl md:text-4xl font-black text-primary mb-1 md:mb-2 tracking-tight text-shadow-sm">MoodSphere</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
              Hello, <span className="font-bold text-primary">{user.fullName}</span> 👋
              {user.role === 'admin' && <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-2 py-0 h-5 text-[10px]">ADMIN</Badge>}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-full shadow-md border border-white/20">
              <Sun className="h-4 w-4 text-yellow-500" />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                className="data-[state=checked]:bg-primary/80"
              />
              <Moon className="h-4 w-4 text-indigo-300 dark:text-indigo-400" />
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-destructive/10 hover:text-destructive group transition-colors">
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${user.role === 'admin' ? 'grid-cols-4' : 'grid-cols-3'} mb-6 md:mb-10 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-white/10`}>
            <TabsTrigger value="track" className="rounded-xl py-2.5 md:py-3 data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground transition-all duration-300 font-semibold tracking-wide">Track</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl py-2.5 md:py-3 data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground transition-all duration-300 font-semibold tracking-wide">History</TabsTrigger>
            <TabsTrigger value="insights" className="rounded-xl py-2.5 md:py-3 data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground transition-all duration-300 font-semibold tracking-wide">Insights</TabsTrigger>
            {user.role === 'admin' && (
              <TabsTrigger value="admin" className="rounded-xl py-2.5 md:py-3 data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground transition-all duration-300 font-semibold tracking-wide flex gap-2 items-center">
                <ShieldAlert className="h-4 w-4" /> Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="track" className="mt-4 animate-in fade-in zoom-in-95 duration-500">
            {/* Top Control Bar: Triggers Left, Submit Right */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
              <div className="w-full md:w-2/3 lg:w-3/4">
                <TriggerSelector
                  onSelectTriggers={setSelectedTriggers}
                  selectedTriggers={selectedTriggers}
                />
              </div>
              <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-2">
                <Button
                  onClick={handleMoodSubmit}
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full shadow-lg hover:shadow-primary/20 transition-all duration-300 py-8 text-lg font-black uppercase tracking-tighter"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5 mb-0.5" />}
                  Submit Log
                </Button>
                <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest opacity-60">
                  Ready to sync your day?
                </p>
              </div>
            </div>

            {/* Questions Section - Balanced Split */}
            <MoodQuestionnaire answers={answers} onAnswerChange={handleAnswerChange} />
          </TabsContent>

          <TabsContent value="history" className="mt-4 animate-in fade-in duration-500">
            <Card className="border-primary/10 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm glass-card overflow-hidden">
              <CardContent className="pt-8 px-2 md:px-6">
                {moodEntries.length > 0 ? (
                  <MoodGraph data={moodEntries} />
                ) : (
                  <div className="text-center py-20">
                    <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="h-8 w-8 text-primary/40" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Your emotional journey starts here.</p>
                    <p className="text-sm text-gray-400 mt-2">Track your first mood to see history.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="mt-4 animate-in fade-in duration-500">
            <Card className="border-primary/10 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm glass-card overflow-hidden">
              <CardContent className="pt-8 px-4 md:px-8">
                {moodEntries.length > 0 ? (
                  <ReportGenerator entries={moodEntries} />
                ) : (
                  <div className="text-center py-20">
                    <div className="bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Loader2 className="h-8 w-8 text-primary/40" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Insights will appear after your first check-in.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === 'admin' && adminData && (
            <TabsContent value="admin" className="mt-4 animate-in fade-in duration-500">
              <AdminDashboard allEntries={adminData.entries} allUsers={adminData.users} />
            </TabsContent>
          )}
        </Tabs>

        {moodEntries.length > 0 && activeTab === "track" && (
          <div className="mt-10 text-center animate-bounce">
            <p className="text-sm font-medium text-primary/60 dark:text-primary/40 bg-primary/5 dark:bg-primary/10 py-2 px-6 rounded-full inline-block">
              You've recorded {moodEntries.length} entries. Keep up the great work! ✨
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
