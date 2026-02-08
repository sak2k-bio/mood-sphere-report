
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!serviceAccountEmail || !privateKey || !sheetId) {
        return res.status(500).json({ error: 'Missing Google credentials in Environment Variables' });
    }

    try {
        const auth = new JWT({
            email: serviceAccountEmail,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(sheetId, auth);
        await doc.loadInfo();

        const dataSheet = doc.sheetsByTitle['MoodData'] || doc.sheetsByIndex[0];
        const userSheet = doc.sheetsByTitle['Users'];

        const { action, username, password } = req.query;

        // --- HANDLE LOGIN ---
        if (req.method === 'GET' && action === 'login') {
            if (!userSheet) return res.status(500).json({ error: 'Authentication sheet "Users" not found' });

            const users = await userSheet.getRows();
            const user = users.find(u => u.get('Username') === username && u.get('Password') === password);

            if (user) {
                return res.status(200).json({
                    success: true,
                    user: {
                        username: user.get('Username'),
                        fullName: user.get('Full Name'),
                        role: user.get('Role') || 'user' // Default to user if not specified
                    }
                });
            } else {
                return res.status(401).json({ error: 'Invalid username or password' });
            }
        }

        // --- HANDLE ADMIN DATA FETCH ---
        if (req.method === 'GET' && action === 'admin_data') {
            if (!userSheet) return res.status(500).json({ error: 'Users sheet not found' });

            const rows = await dataSheet.getRows();
            const users = await userSheet.getRows();

            const allEntries = rows.map(row => ({
                Username: row.get('Username'),
                Date: row.get('Date'),
                "Overall Score": row.get('Overall Score'),
                "Q1: Overall Mood": row.get('Q1: Overall Mood'),
                "Q2: Stress": row.get('Q2: Stress'),
                "Q3: Social": row.get('Q3: Social'),
                "Q4: Energy": row.get('Q4: Energy'),
                "Q5: Satisfaction": row.get('Q5: Satisfaction'),
                Triggers: row.get('Triggers'),
            }));

            const userData = users.map(u => ({
                username: u.get('Username'),
                fullName: u.get('Full Name'),
                role: u.get('Role') || 'user'
            }));

            return res.status(200).json({ entries: allEntries, users: userData });
        }

        // --- HANDLE GET (FETCH ENTRIES FOR SPECIFIC USER) ---
        if (req.method === 'GET') {
            if (!username) return res.status(400).json({ error: 'Username required' });

            const rows = await dataSheet.getRows();
            const userEntries = rows
                .filter(row => row.get('Username') === username)
                .map(row => ({
                    Username: row.get('Username'),
                    Date: row.get('Date'),
                    "Overall Score": row.get('Overall Score'),
                    "Q1: Overall Mood": row.get('Q1: Overall Mood'),
                    "Q2: Stress": row.get('Q2: Stress'),
                    "Q3: Social": row.get('Q3: Social'),
                    "Q4: Energy": row.get('Q4: Energy'),
                    "Q5: Satisfaction": row.get('Q5: Satisfaction'),
                    Triggers: row.get('Triggers'),
                }));
            return res.status(200).json(userEntries);
        }

        // --- HANDLE POST (SAVE ENTRY) ---
        if (req.method === 'POST') {
            const data = req.body;
            if (Array.isArray(data)) {
                await dataSheet.addRows(data);
            } else {
                await dataSheet.addRow(data);
            }
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Google Sheets Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
