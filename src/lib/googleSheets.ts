
import { MoodEntry, JournalEntry, ThoughtRecord } from '../types';

// Points to the secure Vercel Serverless Function
const ENDPOINT = '/api/mood-sync';

// --- MOOD ENTRIES ---

export const fetchEntries = async (username: string): Promise<MoodEntry[]> => {
    try {
        const response = await fetch(`${ENDPOINT}?username=${encodeURIComponent(username)}`);
        if (!response.ok) throw new Error('Failed to fetch from Google Sheets');

        const data = await response.json();

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
        const saved = localStorage.getItem(`moodEntries_${username}`);
        return saved ? JSON.parse(saved) : [];
    }
};

export const saveEntry = async (entry: MoodEntry, username: string): Promise<boolean> => {
    try {
        const payload = {
            Username: username,
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const saved = localStorage.getItem(`moodEntries_${username}`);
        const entries = saved ? JSON.parse(saved) : [];
        localStorage.setItem(`moodEntries_${username}`, JSON.stringify([...entries, entry]));

        return response.ok;
    } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        return false;
    }
};

// --- JOURNAL ENTRIES ---

export const fetchJournal = async (username: string): Promise<JournalEntry[]> => {
    try {
        const response = await fetch(`${ENDPOINT}?action=fetch_journal&username=${encodeURIComponent(username)}`);
        if (!response.ok) throw new Error('Failed to fetch journal');
        return await response.json();
    } catch (error) {
        console.error('Error fetching journal:', error);
        return [];
    }
};

export const saveJournal = async (entry: JournalEntry): Promise<boolean> => {
    try {
        const payload = {
            Username: entry.username,
            Date: entry.date,
            Content: entry.content,
            DayNumber: entry.dayNumber
        };
        const response = await fetch(`${ENDPOINT}?action=save_journal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return response.ok;
    } catch (error) {
        console.error('Error saving journal:', error);
        return false;
    }
};

// --- THOUGHT RECORDS ---

export const fetchThoughtRecords = async (username: string): Promise<ThoughtRecord[]> => {
    try {
        const response = await fetch(`${ENDPOINT}?action=fetch_thought_records&username=${encodeURIComponent(username)}`);
        if (!response.ok) throw new Error('Failed to fetch thought records');
        return await response.json();
    } catch (error) {
        console.error('Error fetching thought records:', error);
        return [];
    }
};

export const saveThoughtRecord = async (record: ThoughtRecord): Promise<boolean> => {
    try {
        const payload = {
            Username: record.username,
            Date: record.date,
            DayNumber: record.dayNumber,
            Situation: record.situation,
            Emotion: record.emotion,
            IntensityScore: record.intensityScore,
            AutomaticThought: record.automaticThought,
            EvidenceFor: record.evidenceFor,
            EvidenceAgainst: record.evidenceAgainst,
            AlternativeThought: record.alternativeThought,
            BehaviorResponse: record.behaviorResponse,
            EmotionAfterIntensity: record.emotionAfterIntensity
        };
        const response = await fetch(`${ENDPOINT}?action=save_thought_record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return response.ok;
    } catch (error) {
        console.error('Error saving thought record:', error);
        return false;
    }
};

// --- MEDICATION ---

export const fetchPrescriptions = async (username: string): Promise<any[]> => {
    try {
        const response = await fetch(`${ENDPOINT}?action=fetch_prescriptions&username=${encodeURIComponent(username)}`);
        if (!response.ok) throw new Error('Failed to fetch prescriptions');
        return await response.json();
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        return [];
    }
};

export const fetchMedLogs = async (username: string): Promise<any[]> => {
    try {
        const response = await fetch(`${ENDPOINT}?action=fetch_med_logs&username=${encodeURIComponent(username)}`);
        if (!response.ok) throw new Error('Failed to fetch medication logs');
        return await response.json();
    } catch (error) {
        console.error('Error fetching medication logs:', error);
        return [];
    }
};

export const saveMedicationLog = async (log: any): Promise<boolean> => {
    try {
        const response = await fetch(`${ENDPOINT}?action=save_med_log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log),
        });
        return response.ok;
    } catch (error) {
        console.error('Error saving medication log:', error);
        return false;
    }
};

export const addPrescription = async (prescription: any): Promise<boolean> => {
    try {
        const response = await fetch(`${ENDPOINT}?action=add_prescription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prescription),
        });
        return response.ok;
    } catch (error) {
        console.error('Error adding prescription:', error);
        return false;
    }
};
