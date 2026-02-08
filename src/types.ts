
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
}

export interface JournalEntry {
  id?: string;
  username: string;
  date: string;
  content: string;
  dayNumber?: number;
}

export interface ThoughtRecord {
  id?: string;
  username: string;
  date: string;
  dayNumber?: number;
  situation: string;
  emotion: string;
  intensityScore: number; // 0-100
  automaticThought: string;
  evidenceFor: string;
  evidenceAgainst: string;
  alternativeThought: string;
  behaviorResponse: string;
  emotionAfterIntensity: number; // 0-100
}
