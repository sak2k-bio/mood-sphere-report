import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { BookOpen, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JournalInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const JournalInput: React.FC<JournalInputProps> = ({ 
  value, 
  onChange,
  placeholder = "How are you feeling today? What's on your mind?"
}) => {
  const [isExpanded, setIsExpanded] = useState(value.length > 0);

  return (
    <Card className="w-full p-4 md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-primary/10 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-base md:text-lg font-medium">Journal Entry</h3>
        </div>
        {!isExpanded && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="text-primary hover:text-primary/80"
          >
            <PenSquare className="h-4 w-4 mr-1" />
            Write
          </Button>
        )}
      </div>
      
      {isExpanded ? (
        <>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[120px] resize-none bg-white/50 dark:bg-gray-900/50"
            autoFocus
          />
          <div className="flex justify-between items-center mt-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {value.length} characters
            </p>
            {value.length === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="text-sm"
              >
                Skip
              </Button>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
          Add a journal entry to capture your thoughts and feelings in more detail.
        </p>
      )}
    </Card>
  );
};

export default JournalInput;