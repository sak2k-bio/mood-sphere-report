import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MoodEntry } from '@/app/types';
import { format } from 'date-fns';
import MoodEmoji from './MoodEmoji';
import { Calendar, BookOpen, Tag } from 'lucide-react';

interface MoodEntryCardProps {
  entry: MoodEntry;
}

const MoodEntryCard: React.FC<MoodEntryCardProps> = ({ entry }) => {
  const date = new Date(entry.date);
  
  return (
    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-primary/10 hover:shadow-lg transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <time className="text-sm text-gray-600 dark:text-gray-400">
                {format(date, 'EEEE, MMMM d, yyyy')} at {format(date, 'h:mm a')}
              </time>
            </div>
            
            {entry.journalNote && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Journal Entry</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {entry.journalNote}
                </p>
              </div>
            )}
            
            {entry.triggers && entry.triggers.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                <div className="flex flex-wrap gap-1.5">
                  {entry.triggers.map((trigger, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary dark:bg-primary/20"
                    >
                      {trigger}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center">
            <MoodEmoji score={entry.overallScore} />
            <span className="text-2xl font-bold text-primary mt-2">
              {entry.overallScore}/10
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodEntryCard;