
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Setup Auth
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!serviceAccountEmail || !privateKey || !sheetId) {
        return res.status(500).json({ error: 'Missing Google credentials in Environment Variables' });
    }

    const auth = new JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(sheetId, auth);

    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        // --- HANDLE GET (FETCH ENTRIES) ---
        if (req.method === 'GET') {
            const rows = await sheet.getRows();
            const entries = rows.map(row => ({
                Date: row.get('Date'),
                "Overall Score": row.get('Overall Score'),
                "Q1: Overall Mood": row.get('Q1: Overall Mood'),
                "Q2: Stress": row.get('Q2: Stress'),
                "Q3: Social": row.get('Q3: Social'),
                "Q4: Energy": row.get('Q4: Energy'),
                "Q5: Satisfaction": row.get('Q5: Satisfaction'),
                Triggers: row.get('Triggers'),
            }));
            return res.status(200).json(entries);
        }

        // --- HANDLE POST (SAVE ENTRY) ---
        if (req.method === 'POST') {
            const data = req.body; // Expecting an array of objects
            if (Array.isArray(data)) {
                await sheet.addRows(data);
            } else {
                await sheet.addRow(data);
            }
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Google Sheets Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
