# Google Sheets Integration Guide

This document details the schema and setup process for using Google Sheets as the database for MoodSphere.

## 1. Sheet Schema

### Tab 1: `MoodData` (Main)
The Google Sheet should have a header row with the following columns:

| Column | Description | Format |
|--------|-------------|--------|
| **Username** | The ID of the user | `String (e.g., john_doe)` |
| **Date** | ISO Timestamp of the entry | `YYYY-MM-DDTHH:mm:ss.sssZ` |
| **Overall Score** | mood score (1-10) | `Number` |
| **Q1: Overall Mood** | Rating for Q1 | `Number (1-10)` |
| **Q2: Stress** | Rating for Q2 | `Number (1-10)` |
| **Q3: Social** | Rating for Q3 | `Number (1-10)` |
| **Q4: Energy** | Rating for Q4 | `Number (1-10)` |
| **Q5: Satisfaction** | Rating for Q5 | `Number (1-10)` |
| **Triggers** | selected triggers | `String` |

### Tab 2: `Users` (Authentication & Roles)
Create a second tab named `Users` for credential storage and access control.

| Username | Password | Full Name | Role |
| :--- | :--- | :--- | :--- |
| james_h | pass123 | James Harrison | admin |
| john_doe | mood789 | John Doe | user |

> [!NOTE]
> - **admin**: Has access to the global "Admin" tab with birds-eye views of all users.
> - **user**: Can only see their own "Track", "History", and "Insights" tabs.

## 🚨 Critical Security Warning: Service Accounts

### Why Vercel ENV variables aren't enough (The "Vite Trap")
Great question! Here is how the "leak" happens:
1. When you use `VITE_` variables, Vite **replaces** them at **build time**.
2. Your `private_key` is literally written into the JavaScript files.
3. When a user opens your site, their browser downloads those JS files.
4. Anyone can look at the "Network" tab in DevTools and see your private key in plain text.

> [!CAUTION]
> Vercel stores variables securely on *their* servers, but the moment your **build script** (Vite) touches them to inject them into the frontend, they become **public**.

### The Secure Way (Vercel Functions)
To keep the key 100% secret, you must use a **Serverless Function**:
- **Secure**: The key stays on Vercel's server and is never sent to the browser.
- **Controlled**: Only your code can use the key to talk to Google.
- **Safe**: Even if malicious users find your site, they can only "Ask" your function to save a mood entry; they can't steal the whole key.

### Option B: API Wrapper Service (Easiest & Secure)
Services like [SheetDB](https://sheetdb.io/) or [Stein](https://steinhq.com/) allow you to link your Google Sheet securely. They handle the authentication on their servers.

## 3. Environment Variables

Add the following to your **Vercel Settings > Environment Variables** (NOT your frontend `.env`):

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_sheet_id_here
```

Your frontend `.env` will only need:

```env
VITE_API_URL=/api/mood-sync
```

## 5. Local Development

To test the secure bridge locally:

1.  **Install Vercel CLI**: `npm i -g vercel`
2.  **Login**: `vercel login`
3.  **Link Project**: `vercel link`
4.  **Pull Secrets**: `vercel env pull .env.local`
    - This creates a `.env.local` file with your production secrets.
    - **Note**: Ensure `.env.local` is in your `.gitignore`.
5.  **Run Dev Server**: Use `vercel dev` instead of `npm run dev`.
    - This will run both your Vite frontend and your Vercel Functions locally.
    - Path: `http://localhost:3000/api/mood-sync`

> [!TIP]
> Variables in `.env.local` **without** the `VITE_` prefix are only accessible to your Serverless Functions (Back-end) and are NOT exposed to the browser.
