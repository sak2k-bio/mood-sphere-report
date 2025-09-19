export interface Question {
  id: number;
  text: string;
}

export interface Answer {
  questionId: number;
  value: number;
}

export interface MoodEntry {
  date: string;
  answers: Answer[];
  overallScore: number;
  triggers?: string[];
  journalNote?: string;
}