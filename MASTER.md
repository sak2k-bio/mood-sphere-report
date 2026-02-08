# MASTER.md - Quick Modification Guide

This document provides instant instructions for tweaking the **Mood Sphere** app components without breaking core functionality.

## 1. Component Sizes & Layout
- **Main Dashboard**: Controlled in [Index.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/pages/Index.tsx). The dashboard uses a tabbed navigation system.
- **Submit Daily Log Button**: Large primary action button with a purple gradient and shimmer effect. Styling is in [Index.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/pages/Index.tsx) using Tailwind and shimmer utility in [index.css](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/index.css).
- **Medication Tracker**: [MedicationTracker.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/MedicationTracker.tsx). Displays prescriptions and a **chronological intake history**.

## 2. Colors & Visual Identity
Styles are managed in [tailwind.config.ts](file:///e:/Code%20projects/github%20projects/mood-sphere-report/tailwind.config.ts).
- **Primary Purple**: `#8B5CF6`.
- **Aesthetic**: Modern glassmorphism using `glass-card` and `backdrop-blur`.
- **Favicon**: Custom SVG mind-sphere icon in `public/favicon.svg`.

## 3. Security & Privacy (Dr. Umme Ammaara)
- **Header Badge**: A security shield icon next to the title in [Index.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/pages/Index.tsx).
- **Text**: Explicitly states data is only accessible to **Dr. Umme Ammaara**. This text is managed within the `TooltipContent` in the header.

## 4. UI Text & Questionnaire
- **Questions**: Modify `moodQuestions` in [MoodQuestionnaire.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/MoodQuestionnaire.tsx).
- **Medication Text**: Update the "No Medications Prescribed" fallback in [MedicationTracker.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/MedicationTracker.tsx).

## 5. API Actions & Synchronization
Backend logic in [api/mood-sync.ts](file:///e:/Code%20projects/github%20projects/mood-sphere-report/api/mood-sync.ts):
- `action=fetch_prescriptions`: [FIXED] Fetches active prescriptions. Uses `medicationName`, `dosage`, `schedule`.
- `action=add_prescription`: Admin tool to assign new medication records.
- `action=delete_prescription`: [NEW] Admin tool to remove active prescriptions.
- `action=save_med_log`: Records daily intake with timestamping.
- `action=fetch_med_logs`: [NEW] Pulls a user's chronological intake history.
- `action=admin_data`: Aggregates all clinical metrics. Enforces patient isolation by **AssociatedPsychiatrist**.

> [!TIP]
> **Robustness**: All clinical components use an internal `safeFormat` helper (in `AdminDashboard.tsx`, `ThoughtRecord.tsx`, etc.) to prevent crashes from empty/malformed Google Sheets rows.

## 6. Mobile UI Optimization
- **Navigation Tabs**: Switched from fixed grid to horizontally scrollable flex container in [Index.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/pages/Index.tsx). Uses `overflow-x-auto` and `no-scrollbar`.
- **Responsive Layouts**: 
    - **Journal**: Added `md:sticky` logic in [EmotionalJournal.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/EmotionalJournal.tsx) to prevent mobile sticky overlap.
    - **Admin Modal**: Uses `max-h-[92vh]` and reduced mobile padding (`p-5`) in [AdminDashboard.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/AdminDashboard.tsx).

## 7. Multi-Admin Infrastructure
- **Data Isolation**: The `admin_data` endpoint automatically filters patients based on the `AssociatedPsychiatrist` column in the Google Sheet.
- **Admin Context**: The `Index.tsx` passes the current admin's `username` to the API to ensure they only see their specific clinical roster.
- **Guide**: Detailed multi-admin setup is in [MULTI_ADMIN_USER.md](file:///e:/Code%20projects/github%20projects/mood-sphere-report/MULTI_ADMIN_USER.md).

## 8. Clinical Toolkit (CBT & Journaling)
- **Emotional Journal**: [EmotionalJournal.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/EmotionalJournal.tsx). Optimized for stream-of-consciousness journaling.
- **Thought Record (CBT)**: [ThoughtRecord.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/ThoughtRecord.tsx). A structured 7-step cognitive behavioral therapy tool with interactive sliders for emotional intensity.

## 9. Admin Triage & Filters
- **Diagnostic Filters**: Implemented in [AdminDashboard.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/AdminDashboard.tsx).
- **Advanced Controls**:
    - **Mood Score Filter**: Isolate patients by average emotional valence.
    - **Activity Filter**: Filter by volume of entries (High/Low engagement).
    - **Prescription Control**: Admins can add new medications directly through the patient "Detailed View" modal.

## 10. .env & Google Sheets
- **GOOGLE_SHEET_ID**: Main database ID.
- **Required Tabs**: `MoodEntries`, `JournalEntries`, `ThoughtRecords`, `MedicationPrescriptions`, `MedicationLogs`.
- **Integration Details**: See the [Full Integration Guide](file:///e:/Code%20projects/github%20projects/mood-sphere-report/GOOGLE_SHEETS_INTEGRATION.md).
