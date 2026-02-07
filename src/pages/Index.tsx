
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from 'next-themes';
import MoodQuestionnaire from '../components/MoodQuestionnaire';
import MoodGraph from '../components/MoodGraph';
import ReportGenerator from '../components/ReportGenerator';
import TriggerSelector from '../components/TriggerSelector';
import Auth from '../components/Auth';
import { MoodEntry } from '../types';
import { Moon, Sun, Loader2, LogOut } from 'lucide-react';
import { fetchEntries, saveEntry } from '../lib/googleSheets';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';

const Index = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [activeTab, setActiveTab] = useState("track");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [user, setUser] = useState<{ username: string, fullName: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();

  // Auth check and Data loading
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const savedUsername = localStorage.getItem('username');
    const savedFullName = localStorage.getItem('fullName');

    if (authStatus && savedUsername && savedFullName) {
      const activeUser = { username: savedUsername, fullName: savedFullName };
      setUser(activeUser);
      loadData(activeUser.username);
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

  const handleAuthenticated = (authenticatedUser: { username: string, fullName: string }) => {
    setUser(authenticatedUser);
    loadData(authenticatedUser.username);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    setUser(null);
    setMoodEntries([]);
    setActiveTab("track");
  };

  const handleMoodSubmit = async (entry: MoodEntry) => {
    if (!user) return;

    const entryWithTriggers = {
      ...entry,
      triggers: selectedTriggers
    };

    // Optimistic update
    setMoodEntries(prev => [...prev, entryWithTriggers]);
    setSelectedTriggers([]);
    setActiveTab("insights");

    // Sync to Google Sheets
    const success = await saveEntry(entryWithTriggers, user.username);
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
    }
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
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">Hello, <span className="font-bold text-primary">{user.fullName}</span> 👋</p>
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
          <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-10 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-1.5 rounded-2xl shadow-inner border border-white/10">
            <TabsTrigger value="track" className="rounded-xl py-2.5 md:py-3 data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground transition-all duration-300 font-semibold tracking-wide">Track</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl py-2.5 md:py-3 data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground transition-all duration-300 font-semibold tracking-wide">History</TabsTrigger>
            <TabsTrigger value="insights" className="rounded-xl py-2.5 md:py-3 data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground transition-all duration-300 font-semibold tracking-wide">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="track" className="mt-4 animate-in fade-in zoom-in-95 duration-500">
            {/* Centered Trigger Selector */}
            <div className="max-w-2xl mx-auto mb-10">
              <TriggerSelector
                onSelectTriggers={setSelectedTriggers}
                selectedTriggers={selectedTriggers}
              />
            </div>

            {/* Questions Section - Layout handled internally by MoodQuestionnaire */}
            <MoodQuestionnaire onSubmit={handleMoodSubmit} />
          </TabsContent>

          <TabsContent value="history" className="mt-4 animate-in fade-in duration-500">
            <Card className="border-primary/10 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm glass-card overflow-hidden">
              <CardContent className="pt-8">
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
