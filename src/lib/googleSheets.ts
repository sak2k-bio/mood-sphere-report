
import { MoodEntry } from '../types';

// Points to the secure Vercel Serverless Function
const ENDPOINT = '/api/mood-sync';

export const fetchEntries = async (): Promise<MoodEntry[]> => {
    try {
        const response = await fetch(ENDPOINT);
        if (!response.ok) throw new Error('Failed to fetch from Google Sheets');

        const data = await response.json();

        // Parse data from sheet format back to MoodEntry format
        return data.map((item: any) => ({
            date: item.Date,
            overallScore: parseFloat(item["Overall Score"]),
            answers: [
                { questionId: 1, value: parseFloat(item["Q1: Overall Mood"]) },
                { questionId: 2, value: parseFloat(item["Q2: Stress"]) },
                { questionId: 3, value: parseFloat(item["Q3: Social"]) },
                { questionId: 4, value: parseFloat(item["Q4: Energy"]) },
                { questionId: 5, value: parseFloat(item["Q5: Satisfaction"]) },
            ],
            triggers: item.Triggers ? item.Triggers.split(', ') : []
        }));
    } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        // Fallback to local storage if API fails
        const saved = localStorage.getItem('moodEntries');
        return saved ? JSON.parse(saved) : [];
    }
};

export const saveEntry = async (entry: MoodEntry): Promise<boolean> => {
    try {
        const payload = {
            Date: entry.date,
            "Overall Score": entry.overallScore,
            "Q1: Overall Mood": entry.answers.find(a => a.questionId === 1)?.value,
            "Q2: Stress": entry.answers.find(a => a.questionId === 2)?.value,
            "Q3: Social": entry.answers.find(a => a.questionId === 3)?.value,
            "Q4: Energy": entry.answers.find(a => a.questionId === 4)?.value,
            "Q5: Satisfaction": entry.answers.find(a => a.questionId === 5)?.value,
            Triggers: entry.triggers?.join(', ') || ''
        };

        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        return response.ok;
    } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        return false;
    }
};
