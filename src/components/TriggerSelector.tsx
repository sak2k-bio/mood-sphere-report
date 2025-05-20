
import React, { useState } from 'react';
import { Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface TriggerSelectorProps {
  onSelectTriggers: (triggers: string[]) => void;
  selectedTriggers?: string[];
}

const commonTriggers = [
  "Work stress",
  "Family conflict",
  "Financial concerns",
  "Health issues",
  "Social anxiety",
  "Sleep problems",
  "Relationship issues",
  "Academic pressure",
  "Traumatic memory",
  "Loneliness",
  "Rejection",
  "Criticism",
  "Major life change",
  "Substance use",
  "Performance anxiety"
];

const TriggerSelector: React.FC<TriggerSelectorProps> = ({ 
  onSelectTriggers,
  selectedTriggers = [] 
}) => {
  const [triggers, setTriggers] = useState<string[]>(selectedTriggers);
  
  const handleToggleTrigger = (trigger: string) => {
    setTriggers(prev => {
      const newTriggers = prev.includes(trigger)
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger];
      
      onSelectTriggers(newTriggers);
      return newTriggers;
    });
  };

  return (
    <div className="w-full p-4 md:p-6 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-primary/10 shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-base md:text-lg font-medium mb-4">Common Triggers</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select any triggers you've experienced today:
      </p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {triggers.map(trigger => (
          <div 
            key={trigger}
            className="px-3 py-1 rounded-full bg-primary/10 text-primary dark:bg-primary/20 text-sm flex items-center gap-1"
          >
            {trigger}
            <button 
              onClick={() => handleToggleTrigger(trigger)}
              className="ml-1 hover:text-destructive"
            >
              ×
            </button>
          </div>
        ))}
        {triggers.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No triggers selected</p>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            Add triggers
            <span className="opacity-70">+</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
          {commonTriggers.map(trigger => (
            <DropdownMenuItem key={trigger} onSelect={(e) => {
              e.preventDefault();
              handleToggleTrigger(trigger);
            }}>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id={`trigger-${trigger}`}
                  checked={triggers.includes(trigger)}
                  onCheckedChange={() => handleToggleTrigger(trigger)}
                />
                <span>{trigger}</span>
                {triggers.includes(trigger) && <Check className="ml-auto h-4 w-4" />}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TriggerSelector;
