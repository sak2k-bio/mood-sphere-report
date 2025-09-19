
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import MoodSlider from './MoodSlider';
import { useToast } from "@/components/ui/use-toast";
import { MoodEntry, Question } from '@/app/types';
import { format } from 'date-fns';

interface MoodQuestionnaireProps {
  onSubmit: (entry: MoodEntry) => void;
}

const questions: Question[] = [
  {
    id: 1,
    text: "How would you rate your overall mood today?",
  },
  {
    id: 2,
    text: "How well did you manage stress today?",
  },
  {
    id: 3,
    text: "How connected did you feel with others today?",
  },
  {
    id: 4,
    text: "How would you rate your energy levels today?",
  },
  {
    id: 5,
    text: "How satisfied are you with your accomplishments today?",
  },
];

// Map question ids to question types for the emoji selector
const questionTypes: {[key: number]: 'general' | 'stress' | 'social' | 'energy' | 'satisfaction'} = {
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Track Your Mood</h2>
        <div className="text-sm text-muted-foreground">
          {format(currentDate, 'EEEE, MMMM d, yyyy')} at {format(currentDate, 'h:mm a')}
        </div>
      </div>
      
      <div className="space-y-8 mb-8">
        {questions.map((question, index) => (
          <MoodSlider 
            key={question.id}
            question={question.text}
            value={answers[index]}
            onChange={(value) => handleAnswerChange(index, value)}
            questionType={questionTypes[question.id]}
          />
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSubmit}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default MoodQuestionnaire;
