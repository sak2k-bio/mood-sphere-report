
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
import { Moon, Sun, Loader2 } from 'lucide-react';
import { fetchEntries, saveEntry } from '../lib/googleSheets';
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [activeTab, setActiveTab] = useState("track");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();

  // Auth check and Data loading
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);

    if (authStatus) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const entries = await fetchEntries();
      setMoodEntries(entries);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Could not fetch entries from Google Sheets. Using local cache if available.",
        variant: "destructive"
      });
      // Fallback to local storage if API fails
      const saved = localStorage.getItem('moodEntries');
      if (saved) setMoodEntries(JSON.parse(saved));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    loadData();
  };

  const handleMoodSubmit = async (entry: MoodEntry) => {
    // Include the selected triggers with the mood entry
    const entryWithTriggers = {
      ...entry,
      triggers: selectedTriggers
    };

    // Optimistic update
    const previousEntries = [...moodEntries];
    setMoodEntries(prev => [...prev, entryWithTriggers]);

    // Also save to local storage as cache
    localStorage.setItem('moodEntries', JSON.stringify([...moodEntries, entryWithTriggers]));

    setSelectedTriggers([]); // Reset triggers after submission
    setActiveTab("insights");

    // Sync to Google Sheets
    const success = await saveEntry(entryWithTriggers);
    if (!success) {
      // We don't necessarily revert here if we want to allow offline-ish behavior, 
      // but the user's COMPASS.md says "replace with real data", so we should warn.
      toast({
        title: "Sync Warning",
        description: "Data saved locally but could not sync to Google Sheets.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Synced Successfully",
        description: "Your mood log has been saved to Google Sheets.",
      });
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!isAuthenticated) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent to-white dark:from-primary/20 dark:to-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading your MoodSphere...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-white dark:from-primary/20 dark:to-background transition-colors duration-300">
      <div className="container max-w-4xl pt-6 md:pt-10 pb-12 md:pb-20 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
          <div className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">MoodSphere</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Track, visualize, and understand your emotional health</p>
          </div>

          <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-2 rounded-full shadow-sm">
            <Sun className="h-4 w-4 text-yellow-500" />
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-primary/80"
            />
            <Moon className="h-4 w-4 text-indigo-300 dark:text-indigo-400" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 md:mb-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <TabsTrigger value="track" className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground">Track Mood</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground">History</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="track" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card className="border-primary/10 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm h-full">
                  <CardContent className="pt-6">
                    <MoodQuestionnaire onSubmit={handleMoodSubmit} />
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-1">
                <TriggerSelector
                  onSelectTriggers={setSelectedTriggers}
                  selectedTriggers={selectedTriggers}
                />
              </div>
            </div>

            {moodEntries.length > 0 && (
              <div className="mt-8 md:mt-10">
                <Card className="border-primary/10 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Recent Mood History</h3>
                    <MoodGraph data={moodEntries.slice(-7)} />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="border-primary/10 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                {moodEntries.length > 0 ? (
                  <MoodGraph data={moodEntries} />
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">No mood entries yet. Start tracking your mood to see history.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="mt-4">
            <Card className="border-primary/10 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                {moodEntries.length > 0 ? (
                  <ReportGenerator entries={moodEntries} />
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Complete a mood check-in to generate insights.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {moodEntries.length > 0 && activeTab === "track" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You've logged {moodEntries.length} mood entries. Great job tracking your emotional health!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
