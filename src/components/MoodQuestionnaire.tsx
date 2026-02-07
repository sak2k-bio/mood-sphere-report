
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import MoodSlider from './MoodSlider';
import { useToast } from "@/components/ui/use-toast";
import { MoodEntry, Question } from '../types';
import { format } from 'date-fns';

interface MoodQuestionnaireProps {
  onSubmit: (entry: MoodEntry) => void;
}

const questions: (Question & { description: string })[] = [
  {
    id: 1,
    text: "How would you rate your overall mood today?",
    description: "Your baseline emotional state, from very low to extremely positive."
  },
  {
    id: 2,
    text: "How well did you manage stress today?",
    description: "Measures your ability to handle pressure and maintain calm."
  },
  {
    id: 3,
    text: "How connected did you feel with others today?",
    description: "The quality and depth of your social interactions and sense of belonging."
  },
  {
    id: 4,
    text: "How would you rate your energy levels today?",
    description: "Physical and mental vitality throughout the day."
  },
  {
    id: 5,
    text: "How satisfied are you with your accomplishments today?",
    description: "Your sense of achievement and productivity relative to your goals."
  },
];

// Map question ids to question types for the emoji selector
const questionTypes: { [key: number]: 'general' | 'stress' | 'social' | 'energy' | 'satisfaction' } = {
  1: 'general',
  2: 'stress',
  3: 'social',
  4: 'energy',
  5: 'satisfaction'
};

const MoodQuestionnaire: React.FC<MoodQuestionnaireProps> = ({ onSubmit }) => {
  const [answers, setAnswers] = useState<number[]>(questions.map(() => 5));
  const { toast } = useToast();
  const currentDate = new Date();

  const handleAnswerChange = (index: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const overallScore = parseFloat((answers.reduce((sum, val) => sum + val, 0) / answers.length).toFixed(1));

    const entry: MoodEntry = {
      date: currentDate.toISOString(),
      answers: answers.map((value, index) => ({
        questionId: questions[index].id,
        value
      })),
      overallScore
    };

    onSubmit(entry);

    toast({
      title: "Mood log saved",
      description: `Your mood score: ${overallScore}/10`,
    });
  };

  return (
    <div className="w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-primary">Track Your Mood</h2>
        <div className="text-sm px-4 py-2 bg-white/40 dark:bg-gray-800/40 rounded-full border border-primary/5 text-muted-foreground shadow-sm">
          {format(currentDate, 'EEEE, MMMM d, yyyy')} at {format(currentDate, 'h:mm a')}
        </div>
      </div>

      {/* 3/2 Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 items-start">
        {/* Left Column: 3 Questions */}
        <div className="space-y-6">
          {questions.slice(0, 3).map((question, index) => (
            <MoodSlider
              key={question.id}
              question={question.text}
              description={question.description}
              value={answers[index]}
              onChange={(value) => handleAnswerChange(index, value)}
              questionType={questionTypes[question.id]}
            />
          ))}
        </div>

        {/* Right Column: 2 Questions */}
        <div className="space-y-6">
          {questions.slice(3).map((question, index) => (
            <MoodSlider
              key={question.id}
              question={question.text}
              description={question.description}
              value={answers[index + 3]}
              onChange={(value) => handleAnswerChange(index + 3, value)}
              questionType={questionTypes[question.id]}
            />
          ))}

          <div className="pt-4">
            <Button onClick={handleSubmit} size="lg" className="w-full shadow-lg hover:shadow-primary/20 transition-all duration-300 py-6 text-lg font-bold">
              Submit Log
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodQuestionnaire;
