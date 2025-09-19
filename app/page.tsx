'use client'

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTheme } from 'next-themes';
import MoodQuestionnaire from './components/MoodQuestionnaire';
import MoodGraph from './components/MoodGraph';
import ReportGenerator from './components/ReportGenerator';
import TriggerSelector from './components/TriggerSelector';
import JournalInput from './components/JournalInput';
import MoodEntryCard from './components/MoodEntryCard';
import DataExport from './components/DataExport';
import MoodPatterns from './components/MoodPatterns';
import MobileNav from './components/MobileNav';
import MoodFilter, { FilterOptions } from './components/MoodFilter';
import { MoodEntry } from './types';
import { Moon, Sun } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export default function Home() {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [activeTab, setActiveTab] = useState("track");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const { setTheme, theme } = useTheme();
  const isMobile = useIsMobile();
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const savedEntries = localStorage.getItem('moodEntries');
    if (savedEntries) {
      setMoodEntries(JSON.parse(savedEntries));
    } else {
      // Generate sample data if no entries exist
      generateSampleData();
    }
  }, []);
  
  // Save data to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('moodEntries', JSON.stringify(moodEntries));
  }, [moodEntries]);
  
  const [journalNote, setJournalNote] = useState<string>('');
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    moodRange: { min: 0, max: 10 },
    selectedTriggers: []
  });

  const handleMoodSubmit = (entry: MoodEntry) => {
    // Include the selected triggers and journal note with the mood entry
    const entryWithTriggersAndNote = {
      ...entry,
      triggers: selectedTriggers,
      journalNote: journalNote.trim() || undefined
    };
    setMoodEntries(prev => [...prev, entryWithTriggersAndNote]);
    setSelectedTriggers([]); // Reset triggers after submission
    setJournalNote(''); // Reset journal note
    setActiveTab("insights");
  };

  // Generate sample data if no entries exist
  const generateSampleData = () => {
    if (moodEntries.length === 0) {
      const sampleData: MoodEntry[] = [];
      const today = new Date();
      
      // Sample triggers for demo data
      const sampleTriggers = [
        ["Work stress", "Sleep problems"],
        ["Family conflict", "Financial concerns"],
        ["Social anxiety", "Loneliness"],
        ["Health issues", "Performance anxiety"],
        ["Relationship issues", "Criticism"],
        ["Academic pressure", "Major life change"],
        ["Traumatic memory", "Rejection"]
      ];
      
      // Sample journal notes
      const sampleNotes = [
        "Had a really tough day at work today. The deadline pressure is getting to me.",
        "Argued with my partner about finances. Feeling overwhelmed and unsupported.",
        "Felt really isolated today. Missed social interactions but too anxious to reach out.",
        "Body aches and fatigue made it hard to focus. Worried about my health.",
        "Got into a disagreement at home. Feeling unheard and misunderstood.",
        "Exams coming up and I'm behind on studying. The pressure is mounting.",
        "Old memories resurfaced today. Trying to process and move forward."
      ];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Create random mood entries with scores between 3 and 8
        const score = 3 + Math.random() * 5;
        sampleData.push({
          date: date.toISOString(),
          answers: Array(5).fill(0).map((_, idx) => ({
            questionId: idx + 1,
            value: 3 + Math.random() * 5
          })),
          overallScore: parseFloat(score.toFixed(1)),
          triggers: i < sampleTriggers.length ? sampleTriggers[i] : [],
          journalNote: i < sampleNotes.length ? sampleNotes[i] : undefined
        });
      }
      
      setMoodEntries(sampleData);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Get all unique triggers from entries
  const getAllTriggers = (): string[] => {
    const allTriggers = new Set<string>();
    moodEntries.forEach(entry => {
      entry.triggers?.forEach(trigger => allTriggers.add(trigger));
    });
    return Array.from(allTriggers).sort();
  };

  // Filter entries based on filters
  const filteredEntries = moodEntries.filter(entry => {
    // Filter by search term (in journal notes)
    if (filters.searchTerm && entry.journalNote) {
      if (!entry.journalNote.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
    } else if (filters.searchTerm && !entry.journalNote) {
      return false;
    }

    // Filter by date range
    const entryDate = new Date(entry.date);
    if (filters.dateFrom && entryDate < filters.dateFrom) return false;
    if (filters.dateTo && entryDate > filters.dateTo) return false;

    // Filter by mood score range
    if (entry.overallScore < filters.moodRange.min || entry.overallScore > filters.moodRange.max) {
      return false;
    }

    // Filter by triggers
    if (filters.selectedTriggers.length > 0) {
      if (!entry.triggers || !filters.selectedTriggers.some(trigger => entry.triggers?.includes(trigger))) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-white dark:from-primary/20 dark:to-background transition-colors duration-300">
      <div className={cn(
        "container max-w-4xl pt-6 md:pt-10 px-4",
        isMobile ? "pb-20" : "pb-12 md:pb-20"
      )}>
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
          {!isMobile && (
            <TabsList className="grid w-full grid-cols-4 mb-6 md:mb-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <TabsTrigger value="track" className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground">Track</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground">History</TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground">Insights</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-white dark:data-[state=active]:text-primary-foreground">Settings</TabsTrigger>
            </TabsList>
          )}
          
          <TabsContent value="track" className="mt-4">
            <div className="space-y-6">
              <Card className="border-primary/10 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <MoodQuestionnaire onSubmit={handleMoodSubmit} />
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TriggerSelector 
                  onSelectTriggers={setSelectedTriggers}
                  selectedTriggers={selectedTriggers}
                />
                <JournalInput
                  value={journalNote}
                  onChange={setJournalNote}
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
            {moodEntries.length > 0 ? (
              <div className="space-y-6">
                <Card className="border-primary/10 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <MoodGraph data={moodEntries} />
                  </CardContent>
                </Card>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Mood History</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredEntries.length} of {moodEntries.length} entries
                    </span>
                  </div>
                  
                  <MoodFilter
                    onFilterChange={setFilters}
                    triggers={getAllTriggers()}
                  />
                  
                  <div className="space-y-4">
                    {filteredEntries.length > 0 ? (
                      [...filteredEntries].reverse().map((entry, index) => (
                        <MoodEntryCard key={index} entry={entry} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No entries match your filters
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Card className="border-primary/10 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">No mood entries yet. Start tracking your mood to see history.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="insights" className="mt-4">
            {moodEntries.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Mood Patterns & Analytics</h3>
                  <MoodPatterns entries={moodEntries} />
                </div>
                
                <Card className="border-primary/10 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <ReportGenerator entries={moodEntries} />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-primary/10 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">Complete a mood check-in to generate insights.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <div className="space-y-6">
              <DataExport 
                entries={moodEntries} 
                onImport={setMoodEntries}
              />
              
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-primary/10">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">About MoodSphere</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    MoodSphere is a comprehensive mood tracking application designed to help you monitor and understand your emotional health over time.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>• Track your mood with detailed questionnaires</p>
                    <p>• Identify triggers affecting your emotional state</p>
                    <p>• Keep journal entries for deeper reflection</p>
                    <p>• Generate reports to share with your therapist</p>
                    <p>• Export your data for backup and analysis</p>
                  </div>
                  <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium text-primary">Privacy First</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      All your data is stored locally on your device. We don't collect or transmit any personal information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
      
      {isMobile && (
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
}