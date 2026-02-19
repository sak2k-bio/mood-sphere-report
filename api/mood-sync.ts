
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

        const dataSheet = doc.sheetsByTitle['MoodData'] || doc.sheetsByTitle['Mood entries'] || doc.sheetsByIndex[0];
        const userSheet = doc.sheetsByTitle['Users'];
        const journalSheet = doc.sheetsByTitle['JournalData'] || doc.sheetsByTitle['JournalEntries'] || doc.sheetsByTitle['Journals'] || doc.sheetsByTitle['Journal'];
        const thoughtRecordSheet = doc.sheetsByTitle['ThoughtRecordData'] || doc.sheetsByTitle['ThoughtRecords'] || doc.sheetsByTitle['CBT'] || doc.sheetsByTitle['ThoughtRecord'];
        const prescriptionSheet = doc.sheetsByTitle['MedicationPrescriptions'] || doc.sheetsByTitle['Prescriptions'] || doc.sheetsByTitle['Prescription'] || doc.sheetsByTitle['Meds'];
        const medLogSheet = doc.sheetsByTitle['MedicationLogs'] || doc.sheetsByTitle['MedLogs'] || doc.sheetsByTitle['MedicationHistory'] || doc.sheetsByTitle['MedicationLog'];

        const { action, username, password } = req.query;

        // --- HELPERS ---
        const safeNum = (val: any) => {
            if (val === undefined || val === null || val === '') return 0;
            const n = Number(val);
            return isNaN(n) ? 0 : n;
        };

        const safeInt = (val: any) => {
            if (val === undefined || val === null || val === '') return null;
            const n = parseInt(val, 10);
            return isNaN(n) ? null : n;
        };

        const safeStr = (val: any) => {
            if (val === undefined || val === null) return '';
            return String(val);
        };

        // --- HANDLE LOGIN ---
        if (action === 'login') {
            console.log(`[LOGIN] Attempt for: ${req.method} ${req.query.username || req.body?.username}`);
            if (!userSheet) return res.status(500).json({ error: 'Authentication sheet "Users" not found' });

            const loginUsername = (req.body?.username || req.query.username) as string;
            const loginPassword = (req.body?.password || req.query.password) as string;

            if (!loginUsername || !loginPassword) {
                return res.status(400).json({ error: 'Username and password required' });
            }

            const users = await userSheet.getRows();
            const user = users.find(u =>
                (u.get('Username') || u.get('username') || '').toString().toLowerCase() === loginUsername.toLowerCase() &&
                (u.get('Password') || u.get('password') || '').toString() === loginPassword
            );

            if (user) {
                return res.status(200).json({
                    success: true,
                    user: {
                        username: safeStr(user.get('Username') || user.get('username')),
                        fullName: safeStr(user.get('Full Name') || user.get('fullName') || user.get('DisplayName') || user.get('displayName') || user.get('username')),
                        role: safeStr(user.get('Role') || user.get('role') || user.get('Type') || user.get('type') || 'user')
                    }
                });
            } else {
                return res.status(401).json({ success: false, error: 'Invalid username or password' });
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
            const isSuperAdmin = username === 'james_h';
            const authorizedPatients = allUsersRows.filter(u => {
                const assignedDoc = u.get('AssociatedPsychiatrist') || u.get('associatedPsychiatrist');
                const uName = u.get('Username') || u.get('username');
                return isSuperAdmin || assignedDoc === username;
            });

            const authorizedUsernames = new Set(authorizedPatients.map(u => safeStr(u.get('Username') || u.get('username')).toLowerCase()));

            // Filter all data packets
            const filteredEntries = allRows
                .filter(row => authorizedUsernames.has(safeStr(row.get('Username') || row.get('username')).toLowerCase()))
                .map(row => ({
                    Username: safeStr(row.get('Username') || row.get('username')),
                    username: safeStr(row.get('Username') || row.get('username')),
                    Date: safeStr(row.get('Date') || row.get('date')),
                    date: safeStr(row.get('Date') || row.get('date')),
                    "Overall Score": safeNum(row.get('Overall Score') || row.get('overallScore') || row.get('Score')),
                    "Q1: Overall Mood": safeNum(row.get('Q1: Overall Mood') || row.get('q1OverallMood')),
                    "Q2: Stress": safeNum(row.get('Q2: Stress') || row.get('q2Stress')),
                    "Q3: Social": safeNum(row.get('Q3: Social') || row.get('q3Social')),
                    "Q4: Energy": safeNum(row.get('Q4: Energy') || row.get('q4Energy')),
                    "Q5: Satisfaction": safeNum(row.get('Q5: Satisfaction') || row.get('q5Satisfaction')),
                    Triggers: safeStr(row.get('Triggers') || row.get('triggers')),
                }));

            const journalData = journals
                .filter(r => authorizedUsernames.has(safeStr(r.get('Username') || r.get('username')).toLowerCase()))
                .map(r => ({
                    username: safeStr(r.get('Username') || r.get('username')),
                    date: safeStr(r.get('Date') || r.get('date') || new Date().toISOString()),
                    content: safeStr(r.get('Content') || r.get('content') || ''),
                    dayNumber: safeInt(r.get('DayNumber') || r.get('dayNumber'))
                }));
            const thoughtData = thoughts
                .filter(r => authorizedUsernames.has(safeStr(r.get('Username') || r.get('username')).toLowerCase()))
                .map(r => ({
                    username: safeStr(r.get('Username') || r.get('username')),
                    date: safeStr(r.get('Date') || r.get('date') || new Date().toISOString()),
                    dayNumber: safeInt(r.get('DayNumber') || r.get('dayNumber')),
                    situation: safeStr(r.get('Situation') || r.get('situation') || ''),
                    emotion: safeStr(r.get('Emotion') || r.get('emotion') || ''),
                    intensityScore: safeNum(r.get('IntensityScore') || r.get('intensityScore')),
                    automaticThought: safeStr(r.get('AutomaticThought') || r.get('automaticThought') || ''),
                    evidenceFor: safeStr(r.get('EvidenceFor') || r.get('evidenceFor') || ''),
                    evidenceAgainst: safeStr(r.get('EvidenceAgainst') || r.get('evidenceAgainst') || ''),
                    alternativeThought: safeStr(r.get('AlternativeThought') || r.get('alternativeThought') || ''),
                    behaviorResponse: safeStr(r.get('BehaviorResponse') || r.get('behaviorResponse') || ''),
                    emotionAfterIntensity: safeNum(r.get('EmotionAfterIntensity') || r.get('emotionAfterIntensity'))
                }));

            const prescriptionData = (prescriptions || [])
                .filter(p => authorizedUsernames.has(safeStr(p.get('Username') || p.get('username')).toLowerCase()))
                .map(p => ({
                    username: safeStr(p.get('Username') || p.get('username')),
                    medicationName: safeStr(p.get('medicationName') || p.get('MedicationName') || p.get('Medication Name') || p.get('Name')),
                    dosage: safeStr(p.get('dosage') || p.get('Dosage') || p.get('Dosage Amount')),
                    status: safeStr(p.get('status') || p.get('Status') || 'Active'),
                    schedule: safeStr(p.get('schedule') || p.get('Schedule') || p.get('Frequency'))
                }));

            const medLogData = logs
                .filter(l => authorizedUsernames.has(safeStr(l.get('Username') || l.get('username')).toLowerCase()))
                .map(l => ({
                    username: safeStr(l.get('Username') || l.get('username')),
                    medicationName: safeStr(l.get('medicationName') || l.get('MedicationName') || l.get('Medication Name')),
                    timestamp: safeStr(l.get('Timestamp') || l.get('timestamp') || new Date().toISOString())
                }));

            const patients = authorizedPatients.map(u => {
                const uName = safeStr(u.get('Username') || u.get('username'));
                const uNameLower = uName.toLowerCase();
                const userEntries = filteredEntries.filter(e => e.username.toLowerCase() === uNameLower);
                const userJournals = journalData.filter(j => j.username.toLowerCase() === uNameLower);
                const userThoughts = thoughtData.filter(t => t.username.toLowerCase() === uNameLower);
                const userLogs = medLogData.filter(l => l.username.toLowerCase() === uNameLower);
                const userMeds = prescriptionData.filter(p => p.username.toLowerCase() === uNameLower);

                // Sort entries by date descending to find latest mood score
                const sortedEntries = [...userEntries].sort((a, b) =>
                    new Date(b.Date).getTime() - new Date(a.Date).getTime()
                );

                const avgMood = userEntries.length > 0
                    ? parseFloat((userEntries.reduce((sum, e) => sum + parseFloat(String(e["Overall Score"])), 0) / userEntries.length).toFixed(1))
                    : 0;

                // Find last activity date across all logs
                const allDates = [
                    ...userEntries.map(e => new Date(e.Date)),
                    ...userJournals.map(j => new Date(j.date)),
                    ...userThoughts.map(t => new Date(t.date)),
                    ...userLogs.map(l => new Date(l.timestamp))
                ].filter(d => !isNaN(d.getTime()));

                const lastActive = allDates.length > 0
                    ? new Date(Math.max(...allDates.map(d => d.getTime()))).toISOString()
                    : null;

                return {
                    username: uName,
                    fullName: safeStr(u.get('Full Name') || u.get('fullName') || u.get('Name')),
                    latestMoodScore: sortedEntries.length > 0 ? sortedEntries[0]["Overall Score"] : 0,
                    averageMoodScore: avgMood,
                    lastActiveDate: lastActive,
                    journalCount: userJournals.length,
                    thoughtRecordCount: userThoughts.length,
                    medLogCount: userLogs.length,
                    prescriptionCount: userMeds.length
                };
            });

            // Find clinician name
            const clinician = allUsersRows.find(u => u.get('Username') === username);
            const clinicianName = clinician ? safeStr(clinician.get('Full Name')) : 'Clinician';

            return res.status(200).json({
                patients: patients,
                clinicianName: clinicianName,
                entries: filteredEntries,
                users: authorizedPatients.map(u => ({
                    username: safeStr(u.get('Username') || u.get('username')),
                    fullName: safeStr(u.get('Full Name') || u.get('fullName') || u.get('Name')),
                    role: safeStr(u.get('Role') || 'user')
                })),
                journalEntries: journalData,
                thoughtRecords: thoughtData,
                prescriptions: prescriptionData,
                medLogs: medLogData
            });
        }

        // --- HANDLE GET (EXISTING MOOD ENTRIES) ---
        if (req.method === 'GET' && (!action || action === 'fetch_moods')) {
            if (!username) return res.status(400).json({ error: 'Username required' });

            const rows = await dataSheet.getRows();
            const userEntries = rows
                .filter(row => row.get('Username') === username)
                .map(row => ({
                    Username: safeStr(row.get('Username')),
                    username: safeStr(row.get('Username')),
                    Date: safeStr(row.get('Date') || new Date().toISOString()),
                    date: safeStr(row.get('Date') || new Date().toISOString()),
                    "Overall Score": safeNum(row.get('Overall Score')),
                    "Q1: Overall Mood": safeNum(row.get('Q1: Overall Mood')),
                    "Q2: Stress": safeNum(row.get('Q2: Stress')),
                    "Q3: Social": safeNum(row.get('Q3: Social')),
                    "Q4: Energy": safeNum(row.get('Q4: Energy')),
                    "Q5: Satisfaction": safeNum(row.get('Q5: Satisfaction')),
                    Triggers: safeStr(row.get('Triggers')),
                }));
            return res.status(200).json(userEntries);
        }

        // --- HANDLE JOURNAL ACTIONS ---
        if ((action === 'fetch_journal' || action === 'fetch_journals') && journalSheet) {
            const rows = await journalSheet.getRows();
            const entries = rows
                .filter(r => r.get('Username') === username)
                .map(r => ({
                    username: safeStr(r.get('Username')),
                    Username: safeStr(r.get('Username')),
                    date: safeStr(r.get('Date') || new Date().toISOString()),
                    Date: safeStr(r.get('Date') || new Date().toISOString()),
                    content: safeStr(r.get('Content')),
                    Content: safeStr(r.get('Content')),
                    dayNumber: safeInt(r.get('DayNumber')),
                    DayNumber: safeInt(r.get('DayNumber'))
                }));
            return res.status(200).json(entries);
        }

        if (req.method === 'POST' && action === 'save_journal' && journalSheet) {
            const data = req.body;
            await journalSheet.addRow({
                Username: data.Username || data.username,
                Date: data.Date || data.date,
                Content: data.Content || data.content,
                DayNumber: data.DayNumber || data.dayNumber
            });
            return res.status(200).json({ success: true });
        }

        // --- HANDLE THOUGHT RECORD ACTIONS ---
        if ((action === 'fetch_thought_records' || action === 'fetch_thought_record') && thoughtRecordSheet) {
            const rows = await thoughtRecordSheet.getRows();
            const entries = rows
                .filter(r => r.get('Username') === username)
                .map(r => ({
                    username: safeStr(r.get('Username')),
                    Username: safeStr(r.get('Username')),
                    date: safeStr(r.get('Date') || new Date().toISOString()),
                    Date: safeStr(r.get('Date') || new Date().toISOString()),
                    dayNumber: safeInt(r.get('DayNumber')),
                    DayNumber: safeInt(r.get('DayNumber')),
                    situation: safeStr(r.get('Situation')),
                    Situation: safeStr(r.get('Situation')),
                    emotion: safeStr(r.get('Emotion')),
                    Emotion: safeStr(r.get('Emotion')),
                    intensityScore: safeNum(r.get('IntensityScore')),
                    IntensityScore: safeNum(r.get('IntensityScore')),
                    automaticThought: safeStr(r.get('AutomaticThought')),
                    AutomaticThought: safeStr(r.get('AutomaticThought')),
                    evidenceFor: safeStr(r.get('EvidenceFor')),
                    EvidenceFor: safeStr(r.get('EvidenceFor')),
                    evidenceAgainst: safeStr(r.get('EvidenceAgainst')),
                    EvidenceAgainst: safeStr(r.get('EvidenceAgainst')),
                    alternativeThought: safeStr(r.get('AlternativeThought')),
                    AlternativeThought: safeStr(r.get('AlternativeThought')),
                    behaviorResponse: safeStr(r.get('BehaviorResponse')),
                    BehaviorResponse: safeStr(r.get('BehaviorResponse')),
                    emotionAfterIntensity: safeNum(r.get('EmotionAfterIntensity')),
                    EmotionAfterIntensity: safeNum(r.get('EmotionAfterIntensity'))
                }));
            return res.status(200).json(entries);
        }

        if (req.method === 'POST' && action === 'save_thought_record' && thoughtRecordSheet) {
            const data = req.body;
            await thoughtRecordSheet.addRow({
                Username: data.Username || data.username,
                Date: data.Date || data.date,
                DayNumber: data.DayNumber || data.dayNumber,
                Situation: data.Situation || data.situation,
                Emotion: data.Emotion || data.emotion,
                IntensityScore: data.IntensityScore || data.intensityScore,
                AutomaticThought: data.AutomaticThought || data.automaticThought,
                EvidenceFor: data.EvidenceFor || data.evidenceFor,
                EvidenceAgainst: data.EvidenceAgainst || data.evidenceAgainst,
                AlternativeThought: data.AlternativeThought || data.alternativeThought,
                BehaviorResponse: data.BehaviorResponse || data.behaviorResponse,
                EmotionAfterIntensity: data.EmotionAfterIntensity || data.emotionAfterIntensity
            });
            return res.status(200).json({ success: true });
        }

        // --- HANDLE MEDICATION ACTIONS ---
        if (req.method === 'GET' && action === 'fetch_prescriptions' && prescriptionSheet) {
            const rows = await prescriptionSheet.getRows();
            const entries = rows
                .filter(p => (p.get('Username') || p.get('username')) === username)
                .map(p => ({
                    username: safeStr(p.get('Username') || p.get('username')),
                    Username: safeStr(p.get('Username') || p.get('username')),
                    medicationName: safeStr(p.get('medicationName') || p.get('MedicationName') || p.get('Medication Name') || p.get('Name')),
                    MedicationName: safeStr(p.get('medicationName') || p.get('MedicationName') || p.get('Medication Name') || p.get('Name')),
                    dosage: safeStr(p.get('dosage') || p.get('Dosage') || p.get('Dosage Amount')),
                    Dosage: safeStr(p.get('dosage') || p.get('Dosage') || p.get('Dosage Amount')),
                    status: safeStr(p.get('status') || p.get('Status') || 'Active'),
                    Status: safeStr(p.get('status') || p.get('Status') || 'Active'),
                    schedule: safeStr(p.get('schedule') || p.get('Schedule') || p.get('Frequency')),
                    Schedule: safeStr(p.get('schedule') || p.get('Schedule') || p.get('Frequency'))
                }));
            return res.status(200).json(entries);
        }

        if (req.method === 'POST' && action === 'add_prescription' && prescriptionSheet) {
            const data = req.body;
            await prescriptionSheet.addRow({
                Username: data.Username || data.username,
                username: data.Username || data.username,
                MedicationName: data.medicationName || data.MedicationName,
                medicationName: data.medicationName || data.MedicationName,
                "Medication Name": data.medicationName || data.MedicationName,
                Dosage: data.dosage || data.Dosage,
                dosage: data.dosage || data.Dosage,
                Schedule: data.schedule || data.Schedule || '',
                schedule: data.schedule || data.Schedule || '',
                Status: data.status || data.Status || 'Active',
                status: data.status || data.Status || 'Active'
            });
            return res.status(200).json({ success: true });
        }

        if (req.method === 'POST' && action === 'delete_prescription' && prescriptionSheet) {
            const data = req.body;
            const uName = data.Username || data.username;
            const mName = data.medicationName || data.MedicationName;
            const rows = await prescriptionSheet.getRows();
            const rowToDelete = rows.find(r =>
                r.get('Username') === uName &&
                (r.get('medicationName') === mName || r.get('MedicationName') === mName)
            );

            if (rowToDelete) {
                await rowToDelete.delete();
                return res.status(200).json({ success: true });
            }
            return res.status(404).json({ error: 'Prescription not found' });
        }

        if (req.method === 'GET' && (action === 'fetch_med_logs' || action === 'fetch_medication_logs') && medLogSheet) {
            const rows = await medLogSheet.getRows();
            const entries = rows
                .filter(l => l.get('Username') === username)
                .map(l => ({
                    username: safeStr(l.get('Username')),
                    Username: safeStr(l.get('Username')),
                    medicationName: safeStr(l.get('medicationName') || l.get('MedicationName') || ''),
                    MedicationName: safeStr(l.get('medicationName') || l.get('MedicationName') || ''),
                    timestamp: safeStr(l.get('Timestamp') || l.get('timestamp') || new Date().toISOString()),
                    Timestamp: safeStr(l.get('Timestamp') || l.get('timestamp') || new Date().toISOString())
                }));
            return res.status(200).json(entries);
        }

        if (req.method === 'POST' && action === 'save_med_log' && medLogSheet) {
            const data = req.body;
            await medLogSheet.addRow({
                Username: data.Username || data.username,
                username: data.Username || data.username,
                MedicationName: data.medicationName || data.MedicationName,
                medicationName: data.medicationName || data.MedicationName,
                "Medication Name": data.medicationName || data.MedicationName,
                Timestamp: data.timestamp || data.Timestamp || new Date().toISOString(),
                timestamp: data.timestamp || data.Timestamp || new Date().toISOString()
            });
            return res.status(200).json({ success: true });
        }

        // --- HANDLE POST (DEFAULT MOOD ENTRY) ---
        // ONLY trigger this if no action is specified to prevent swallowing specific POST actions
        if (req.method === 'POST' && !action) {
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
