# Backend Sync API Specifications

This document defines the shared API protocol between the **Web Dashboard**, **Mobile App**, and the **Vercel Backend** (`api/mood-sync.ts`).

## Architecture Overview

The API acts as a gateway to Google Sheets. To maintain compatibility between the Web App (using `camelCase`) and the Mobile App (using `PascalCase`), the backend implements a **Dual-Casing Response Strategy**.

---

## 1. Authentication
**Endpoint:** `GET /api/mood-sync?action=login`

**Parameters:**
| Parameter | Description |
|-----------|-------------|
| `username`| The user's ID |
| `password`| The user's password |

**Success Response:**
```json
{
  "success": true,
  "user": { "username": "...", "fullName": "...", "role": "..." }
}
```

---

## 2. Global Sync (Pulling History)

The following actions support both singular and plural names to maintain cross-platform support. All responses include **Dual-Casing Aliases**.

### Fetch Moods
`GET /api/mood-sync?action=fetch_moods&username=...`
- **Keys:** `Date`, `Overall Score`, `Q1...Q5`, `Triggers`

### Fetch Journals
`GET /api/mood-sync?action=fetch_journals&username=...` (also supports `fetch_journal`)
- **Dual Keys:** `content` / `Content`, `date` / `Date`, `dayNumber` / `DayNumber`

### Fetch Thought Records (CBT)
`GET /api/mood-sync?action=fetch_thought_records&username=...`
- **Dual Keys:** `situation`/`Situation`, `emotion`/`Emotion`, `intensityScore`/`IntensityScore`, etc.

### Fetch Medication
- **Prescriptions:** `GET /api/mood-sync?action=fetch_prescriptions&username=...`
- **Intake Logs:** `GET /api/mood-sync?action=fetch_med_logs&username=...`

---

## 4. Clinical Admin Data
**Endpoint:** `GET /api/mood-sync?action=admin_data&username=[clinician_username]`

This endpoint returns a consolidated view of all patients assigned to a specific clinician.

**Response Structure:**
```json
{
  "clinicianName": "Dr. Amara Clark",
  "patients": [
    {
      "username": "ryan",
      "fullName": "Ryan Smith",
      "latestMoodScore": 8.5,
      "journalCount": 12,
      "thoughtRecordCount": 5,
      "medLogCount": 30,
      "prescriptionCount": 2
    }
  ]
}
```

---

## 5. Data Ingestion (Pushing Logs)

**Endpoint:** `POST /api/mood-sync?action=[action]`

The backend is designed to be **convention-agnostic**. It will accept either `camelCase` or `PascalCase` properties in the JSON body.

### Example: Save Journal
```json
{
  "Username": "ryan",
  "Date": "2024-03-20T...",
  "Content": "Testing dual-casing..."
}
```
*Note: The backend also extracts from `username`, `date`, and `content` if provided.*

---

## 6. Key Compatibility Rules

> [!IMPORTANT]
> **Why Dual-Casing?** 
> The Mobile app's Dart models (Retrofit) are strictly mapped to `PascalCase` to match the Google Sheets headers. The Web app (TypeScript) expects `camelCase` for its UI state. The backend provides both to avoid breaking changes or redundant API calls.

1. **Plural Actions**: Always prefer plural names (e.g., `fetch_journals`) for new mobile calls.
2. **Sheet Title Resilience**: The API includes fallbacks for common naming conventions (e.g., `MedicationPrescriptions` or `Prescriptions`, `MoodData` or `Mood entries`).
3. **Username Isolation**: All `GET` and `POST` requests MUST include a username to maintain HIPAA-compliant data isolation.
4. **Numeric Type Safety**:
    - **CRITICAL**: Google Sheets often stores values as Strings. Flutter's Dart models will crash with `type 'String' is not a subtype of type 'num'` if the API returns a string for a numeric field.
    - **Fix**: The backend MUST use `safeNum()` or `safeInt()` to explicitly cast data.
5. **String Safety**: 
    - **CRITICAL**: Dart's non-nullable strings will crash with `type 'Null' is not a subtype of type 'String'` if a field is null.
    - **Fix**: Use `safeStr()` in the backend to ensure empty cells return `""` instead of `null`.
