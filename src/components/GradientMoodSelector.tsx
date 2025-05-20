
import React from 'react';
import { Smile, Laugh, Meh, Frown, Angry, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GradientMoodSelectorProps {
  value: number;
  onChange: (value: number) => void;
  questionType?: 'general' | 'stress' | 'social' | 'energy' | 'satisfaction';
}

const GradientMoodSelector: React.FC<GradientMoodSelectorProps> = ({
  value,
  onChange,
  questionType = 'general'
}) => {
  // Define smiley face options for each value
  const options = [
    { value: 0, label: 'Terrible' },
    { value: 2, label: 'Bad' },
    { value: 4, label: 'Okay' },
    { value: 6, label: 'Good' },
    { value: 8, label: 'Great' },
    { value: 10, label: 'Excellent' }
  ];
  
  // Get the appropriate icon based on question type and mood value
  const getIcon = (val: number, type: string) => {
    // Base icons for general mood
    if (val >= 8) {
      return <Laugh size={32} />;
    } else if (val >= 6) {
      return <Smile size={32} />;
    } else if (val >= 4) {
      return <Meh size={32} />;
    } else if (val >= 2) {
      return <Frown size={32} />;
    } else {
      return <Angry size={32} />;
    }
  };

  // Get custom color based on question type
  const getColorClass = (type: string) => {
    switch (type) {
      case 'general':
        return 'from-mood-terrible via-mood-okay to-mood-great';
      case 'stress':
        return 'from-red-400 via-yellow-300 to-green-400';
      case 'social':
        return 'from-indigo-400 via-purple-300 to-pink-300';
      case 'energy':
        return 'from-gray-400 via-yellow-300 to-yellow-500';
      case 'satisfaction':
        return 'from-blue-400 via-purple-300 to-heart-400';
      default:
        return 'from-mood-terrible via-mood-okay to-mood-great';
    }
  };

  return (
    <div className="w-full">
      <div className={`flex justify-between items-center my-4 px-2 py-3 rounded-full bg-gradient-to-r ${getColorClass(questionType)}`}>
        {options.map((option) => (
          <div 
            key={option.value} 
            className={cn(
              "flex flex-col items-center cursor-pointer transition-all",
              "transform hover:scale-110 p-2 rounded-full",
              value === option.value ? "bg-white/30 shadow-lg scale-110" : "hover:bg-white/10"
            )}
            onClick={() => onChange(option.value)}
          >
            <div className={cn(
              "text-white transition-colors",
              value === option.value ? "text-primary-foreground" : ""
            )}>
              {getIcon(option.value, questionType)}
            </div>
            <span className={cn(
              "text-xs font-medium mt-1 text-white",
              value === option.value ? "font-bold" : ""
            )}>
              {option.label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>0</span>
        <span className="font-semibold text-primary">{value}/10</span>
        <span>10</span>
      </div>
    </div>
  );
};

export default GradientMoodSelector;
