
import React from 'react';
import MoodSlider from './MoodSlider';
import { Question } from '../types';
import { format } from 'date-fns';

interface MoodQuestionnaireProps {
  answers: number[];
  onAnswerChange: (index: number, value: number) => void;
}

export const moodQuestions: (Question & { description: string })[] = [
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

export const questionTypes: { [key: number]: 'general' | 'stress' | 'social' | 'energy' | 'satisfaction' } = {
  1: 'general',
  2: 'stress',
  3: 'social',
  4: 'energy',
  5: 'satisfaction'
};

const MoodQuestionnaire: React.FC<MoodQuestionnaireProps> = ({ answers, onAnswerChange }) => {
  const currentDate = new Date();

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
          {moodQuestions.slice(0, 3).map((question, index) => (
            <MoodSlider
              key={question.id}
              question={question.text}
              description={question.description}
              value={answers[index]}
              onChange={(value) => onAnswerChange(index, value)}
              questionType={questionTypes[question.id]}
            />
          ))}
        </div>

        {/* Right Column: 2 Questions */}
        <div className="space-y-6">
          {moodQuestions.slice(3).map((question, index) => (
            <MoodSlider
              key={question.id}
              question={question.text}
              description={question.description}
              value={answers[index + 3]}
              onChange={(value) => onAnswerChange(index + 3, value)}
              questionType={questionTypes[question.id]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodQuestionnaire;
