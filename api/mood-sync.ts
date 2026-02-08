
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
        const journalSheet = doc.sheetsByTitle['JournalData'];
        const thoughtRecordSheet = doc.sheetsByTitle['ThoughtRecordData'];
        const prescriptionSheet = doc.sheetsByTitle['MedicationPrescriptions'];
        const medLogSheet = doc.sheetsByTitle['MedicationLogs'];

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
                        role: user.get('Role') || 'user'
                    }
                });
            } else {
                return res.status(401).json({ error: 'Invalid username or password' });
            }
        }

        // --- HANDLE ADMIN DATA FETCH ---
        if (req.method === 'GET' && action === 'admin_data') {
            if (!userSheet) return res.status(500).json({ error: 'Users sheet not found' });
            if (!username) return res.status(400).json({ error: 'Admin username required for isolation' });

            const [allRows, allUsersRows, journals, thoughts, prescriptions, logs] = await Promise.all([
                dataSheet.getRows(),
                userSheet.getRows(),
                journalSheet ? journalSheet.getRows() : Promise.resolve([]),
                thoughtRecordSheet ? thoughtRecordSheet.getRows() : Promise.resolve([]),
                prescriptionSheet ? prescriptionSheet.getRows() : Promise.resolve([]),
                medLogSheet ? medLogSheet.getRows() : Promise.resolve([])
            ]);

            // Determine authorized patients for this admin
            // A Super Admin (james_h) might see everything, others see only their assigned patients
            const isSuperAdmin = username === 'james_h';
            const authorizedPatients = allUsersRows.filter(u => {
                const assignedDoc = u.get('AssociatedPsychiatrist');
                return isSuperAdmin || assignedDoc === username;
            });

            const authorizedUsernames = new Set(authorizedPatients.map(u => u.get('Username')));

            // Filter all data packets
            const filteredEntries = allRows
                .filter(row => authorizedUsernames.has(row.get('Username')))
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

            const userData = authorizedPatients.map(u => ({
                username: u.get('Username'),
                fullName: u.get('Full Name'),
                role: u.get('Role') || 'user',
                associatedPsychiatrist: u.get('AssociatedPsychiatrist')
            }));

            const journalData = journals
                .filter(r => authorizedUsernames.has(r.get('Username')))
                .map(r => ({
                    username: r.get('Username'),
                    date: r.get('Date') || r.get('date') || new Date().toISOString(),
                    content: r.get('Content') || r.get('content') || '',
                    dayNumber: r.get('DayNumber') || r.get('dayNumber')
                }));

            const thoughtData = thoughts
                .filter(r => authorizedUsernames.has(r.get('Username')))
                .map(r => ({
                    username: r.get('Username'),
                    date: r.get('Date') || r.get('date') || new Date().toISOString(),
                    dayNumber: r.get('DayNumber') || r.get('dayNumber'),
                    situation: r.get('Situation') || r.get('situation') || '',
                    emotion: r.get('Emotion') || r.get('emotion') || '',
                    intensityScore: r.get('IntensityScore') || r.get('intensityScore') || 0,
                    automaticThought: r.get('AutomaticThought') || r.get('automaticThought') || '',
                    evidenceFor: r.get('EvidenceFor') || r.get('evidenceFor') || '',
                    evidenceAgainst: r.get('EvidenceAgainst') || r.get('evidenceAgainst') || '',
                    alternativeThought: r.get('AlternativeThought') || r.get('alternativeThought') || '',
                    behaviorResponse: r.get('BehaviorResponse') || r.get('behaviorResponse') || '',
                    emotionAfterIntensity: r.get('EmotionAfterIntensity') || r.get('emotionAfterIntensity') || 0
                }));

            const prescriptionData = prescriptions
                .filter(p => authorizedUsernames.has(p.get('Username')))
                .map(p => ({
                    username: p.get('Username'),
                    medicationName: p.get('medicationName') || p.get('MedicationName'),
                    dosage: p.get('dosage') || p.get('Dosage'),
                    status: p.get('status') || p.get('Status') || 'Active',
                    schedule: p.get('schedule') || p.get('Schedule')
                }));

            const medLogData = logs
                .filter(l => authorizedUsernames.has(l.get('Username')))
                .map(l => ({
                    username: l.get('Username'),
                    medicationName: l.get('medicationName') || l.get('MedicationName') || '',
                    timestamp: l.get('Timestamp') || l.get('timestamp') || new Date().toISOString()
                }));

            return res.status(200).json({
                entries: filteredEntries,
                users: userData,
                journalEntries: journalData,
                thoughtRecords: thoughtData,
                prescriptions: prescriptionData,
                medLogs: medLogData
            });
        }

        // --- HANDLE GET (EXISTING MOOD ENTRIES) ---
        if (req.method === 'GET' && !action) {
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

        // --- HANDLE JOURNAL ACTIONS ---
        if (action === 'fetch_journal' && journalSheet) {
            const rows = await journalSheet.getRows();
            const entries = rows
                .filter(r => r.get('Username') === username)
                .map(r => ({
                    username: r.get('Username'),
                    date: r.get('Date'),
                    content: r.get('Content'),
                    dayNumber: r.get('DayNumber')
                }));
            return res.status(200).json(entries);
        }

        if (req.method === 'POST' && action === 'save_journal' && journalSheet) {
            await journalSheet.addRow(req.body);
            return res.status(200).json({ success: true });
        }

        // --- HANDLE THOUGHT RECORD ACTIONS ---
        if (action === 'fetch_thought_records' && thoughtRecordSheet) {
            const rows = await thoughtRecordSheet.getRows();
            const entries = rows
                .filter(r => r.get('Username') === username)
                .map(r => ({
                    username: r.get('Username'),
                    date: r.get('Date'),
                    dayNumber: r.get('DayNumber'),
                    situation: r.get('Situation'),
                    emotion: r.get('Emotion'),
                    intensityScore: r.get('IntensityScore'),
                    automaticThought: r.get('AutomaticThought'),
                    evidenceFor: r.get('EvidenceFor'),
                    evidenceAgainst: r.get('EvidenceAgainst'),
                    alternativeThought: r.get('AlternativeThought'),
                    behaviorResponse: r.get('BehaviorResponse'),
                    emotionAfterIntensity: r.get('EmotionAfterIntensity')
                }));
            return res.status(200).json(entries);
        }

        if (req.method === 'POST' && action === 'save_thought_record' && thoughtRecordSheet) {
            await thoughtRecordSheet.addRow(req.body);
            return res.status(200).json({ success: true });
        }

        // --- HANDLE MEDICATION ACTIONS ---
        if (req.method === 'GET' && action === 'fetch_prescriptions' && prescriptionSheet) {
            const rows = await prescriptionSheet.getRows();
            const entries = rows
                .filter(p => p.get('Username') === username)
                .map(p => ({
                    username: p.get('Username'),
                    medicationName: p.get('medicationName') || p.get('MedicationName'),
                    dosage: p.get('dosage') || p.get('Dosage'),
                    status: p.get('status') || p.get('Status') || 'Active',
                    schedule: p.get('schedule') || p.get('Schedule')
                }));
            return res.status(200).json(entries);
        }

        if (req.method === 'POST' && action === 'add_prescription' && prescriptionSheet) {
            const data = req.body;
            // Payload should match: { Username, medicationName, dosage, Status/Schedule }
            await prescriptionSheet.addRow({
                Username: data.username,
                medicationName: data.medicationName,
                dosage: data.dosage,
                schedule: data.schedule || '',
                Status: data.status || 'Active'
            });
            return res.status(200).json({ success: true });
        }

        if (req.method === 'POST' && action === 'delete_prescription' && prescriptionSheet) {
            const { username, medicationName } = req.body;
            const rows = await prescriptionSheet.getRows();
            const rowToDelete = rows.find(r =>
                r.get('Username') === username &&
                (r.get('medicationName') === medicationName || r.get('MedicationName') === medicationName)
            );

            if (rowToDelete) {
                await rowToDelete.delete();
                return res.status(200).json({ success: true });
            }
            return res.status(404).json({ error: 'Prescription not found' });
        }

        if (req.method === 'GET' && action === 'fetch_med_logs' && medLogSheet) {
            const rows = await medLogSheet.getRows();
            const entries = rows
                .filter(l => l.get('Username') === username)
                .map(l => ({
                    username: l.get('Username'),
                    medicationName: l.get('medicationName') || l.get('MedicationName') || '',
                    timestamp: l.get('Timestamp') || l.get('timestamp') || new Date().toISOString()
                }));
            return res.status(200).json(entries);
        }

        if (req.method === 'POST' && action === 'save_med_log' && medLogSheet) {
            const data = req.body;
            await medLogSheet.addRow({
                Username: data.username,
                medicationName: data.medicationName,
                Timestamp: data.timestamp || new Date().toISOString()
            });
            return res.status(200).json({ success: true });
        }

        // --- HANDLE POST (DEFAULT MOOD ENTRY) ---
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
