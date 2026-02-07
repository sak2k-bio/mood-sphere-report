# MASTER.md - Quick Modification Guide

This document provides instant instructions for tweaking the MoodSphere app components without breaking core functionality.

## 1. Component Sizes & Layout
- **Main Container**: `max-w-4xl` in [Index.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/pages/Index.tsx#L91).
- **Graph Heights**: 
  - Recent History: Default in [Index.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/pages/Index.tsx#L139).
  - Main Trend: `height={200}` in [ReportGenerator.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/ReportGenerator.tsx#L211).
- **Cards**: Background opacity/blur in [ReportGenerator.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/ReportGenerator.tsx#L182) (`bg-white/60 backdrop-blur-sm`).

## 2. Colors & Visual Identity
Styles are managed in [tailwind.config.ts](file:///e:/Code%20projects/github%20projects/mood-sphere-report/tailwind.config.ts).
- **Primary Purple**: `#8B5CF6` [L29](file:///e:/Code%20projects/github%20projects/mood-sphere-report/tailwind.config.ts#L29).
- **Mood Scale**: Defined in `mood` object [L66-72](file:///e:/Code%20projects/github%20projects/mood-sphere-report/tailwind.config.ts#L66-72).
- **Satisfaction Emoji**: Pink color `#FF5E94` [L74](file:///e:/Code%20projects/github%20projects/mood-sphere-report/tailwind.config.ts#L74).

## 3. UI Text & Questionnaire
- **App Title**: "MoodSphere" in [Index.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/pages/Index.tsx#L94).
- **Questions**: Modify the `questions` array in [MoodQuestionnaire.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/MoodQuestionnaire.tsx#L13-34).
- **Triggers**: Add/remove from `TRIGGER_CATEGORIES` in [TriggerSelector.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/TriggerSelector.tsx).

## 4. Payment Gateway & Costs
> [!NOTE]
> Currently, the app is a free local-only utility. No payment gateway is integrated.
- **To add Stripe/PayPal**: Implement in a new `api/checkout` route.
- **Pricing Display**: Create a `Pricing.tsx` component in `src/components`.

## 5. Agent System Prompts
> [!IMPORTANT]
> This project currently uses a **Rule-Based Report Generator** ([ReportGenerator.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/ReportGenerator.tsx#L115)) instead of an LLM.
- **Mock Prompt (If integrating AI)**:
  ```text
  You are an empathetic Mental Health AI. Analyze the user's mood score of {score} and 
  recent triggers {triggers} to provide actionable self-care advice.
  ```
- **Analysis Logic**: Change recommendation triggers in [ReportGenerator.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/ReportGenerator.tsx#L100-108).

## 6. API Routes & Security
- **Backend**: N/A (Client-side localStorage).
- **Security Check**: Local storage is accessible via browser dev tools. Do not store PII without encryption.

## 7. .env Related Changes
Current `.env` requirements:
- None.
Future requirements (if adding AI/Cloud):
- `VITE_GEMINI_API_KEY`: For AI analysis.
- `VITE_STRIPE_PUBLIC_KEY`: For payments.

## 9. Authentication
- **Default Password**: Set to `mood123` in [Auth.tsx](file:///e:/Code%20projects/github%20projects/mood-sphere-report/src/components/Auth.tsx#L19).
- **Environment Variable**: Use `VITE_AUTH_PASSWORD` in your `.env` to override the default.
- **Logout**: Clear `isAuthenticated` from `localStorage` to log out.
