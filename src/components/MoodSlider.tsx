
import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Smile, SlidersHorizontal, Info } from "lucide-react";
import MoodEmoji from './MoodEmoji';
import GradientMoodSelector from './GradientMoodSelector';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MoodSliderProps {
  question: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  questionType?: 'general' | 'stress' | 'social' | 'energy' | 'satisfaction';
}

const MoodSlider: React.FC<MoodSliderProps> = ({
  question,
  description,
  value,
  onChange,
  questionType = 'general'
}) => {
  const [useGradient, setUseGradient] = useState(false);

  const toggleInterface = () => {
    setUseGradient(!useGradient);
  };

  return (
    <div className="w-full p-4 md:p-6 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow border border-primary/10">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-base md:text-lg font-medium">{question}</h3>
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-gray-900 border-primary/10 shadow-xl p-3">
                  <p className="max-w-xs text-sm leading-relaxed">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleInterface}
          className="h-8 w-8 p-0 rounded-full"
          title={useGradient ? "Switch to slider" : "Switch to emoji selector"}
        >
          {useGradient ? <SlidersHorizontal size={16} /> : <Smile size={16} />}
        </Button>
      </div>

      {useGradient ? (
        <GradientMoodSelector
          value={value}
          onChange={onChange}
          questionType={questionType}
        />
      ) : (
        <div className="flex flex-col items-center gap-4 md:gap-6 mb-3">
          <MoodEmoji score={value} className="animate-float" />
          <Slider
            value={[value]}
            min={0}
            max={10}
            step={1}
            onValueChange={(vals) => onChange(vals[0])}
            className="w-full max-w-md mx-auto"
          />
          <div className="flex justify-between w-full max-w-md mx-auto text-sm text-gray-500 dark:text-gray-400">
            <span>Low</span>
            <span className="font-semibold text-primary">{value}/10</span>
            <span>High</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodSlider;
