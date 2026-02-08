# MASTER.md - Quick Modification Guide

This document provides instant instructions for tweaking the MoodSphere app components without breaking core functionality.

## 1. Component Sizes & Layout
- **Main Dashboard**: Controlled in [Index.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/pages/Index.tsx). The "Track" tab uses a 3/2 split layout.
- **Trigger Selector**: Positioned at the top center with a max-width in [Index.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/pages/Index.tsx).
- **Submit Button**: Located at the top-right of the "Track" tab in [Index.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/pages/Index.tsx).
- **Graph Heights**: 
  - Recent History: Handled by [MoodGraph.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/MoodGraph.tsx).
  - Main Trend: `height={200}` in [ReportGenerator.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/ReportGenerator.tsx).

## 2. Colors & Visual Identity
Styles are managed in [tailwind.config.ts](file:///e:/Code%20projects/github%20projects/mood-sphere-report/tailwind.config.ts).
- **Primary Purple**: `#8B5CF6`.
- **Mood Scale**: Defined in `mood` object within the Tailwind config.
- **Aesthetic**: Uses `glass-card` and `bg-white/80` for a premium, translucent look.

## 3. UI Text & Questionnaire
- **Questions**: Modify the `moodQuestions` array in [MoodQuestionnaire.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/MoodQuestionnaire.tsx).
- **Tooltips**: Update the `description` field in the same array to change hover info.
- **Triggers**: Add/remove categories and descriptions in [TriggerSelector.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/TriggerSelector.tsx).

## 4. API Routes & Security
- **Backend Function**: [api/mood-sync.ts](file:///e:/Code%20projects/github%20projects/mood-sphere-report/api/mood-sync.ts).
- **Actions**:
    - `action=login`: Credential verification.
    - `action=admin_data`: Fetch all users/logs for administrators.
- **Security**: Service account keys are stored in Vercel ENV variables and never exposed to the frontend.

## 5. .env Requirements
Ensure these are set in your deployment environment (e.g., Vercel):
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Service account email.
- `GOOGLE_PRIVATE_KEY`: Private key (ensure `\n` is handled).
- `GOOGLE_SHEET_ID`: The ID of your Google Sheet.

## 6. Authentication & Roles
- **System**: Multi-user login backed by the `Users` tab in Google Sheets.
- **Roles**: 
    - `admin`: Full access + "Admin" tab ([AdminDashboard.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/AdminDashboard.tsx)).
    - `user`: Standard tracking and personal history only.
- **Logout**: Handled in `handleLogout` within `Index.tsx`.

## 7. Admin Bird's Eye View
- **Component**: [AdminDashboard.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/AdminDashboard.tsx).
- **Modification**: Adjust the `getUserStats` logic to change how users are summarized in the grid view.
