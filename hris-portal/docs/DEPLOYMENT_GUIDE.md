# 🚀 Deployment Guide: PAO HRMS

This guide outlines the steps to deploy the Provincial Assessor's Office HR Management System to production using **Vercel** and **Supabase**.

## 1. Prerequisites
- A GitHub repository with the finalized codebase.
- A production-ready Supabase Project.
- A Vercel account.

## 2. Supabase Production Setup
1.  **Run Migrations**: 
    Copy and execute all SQL files from the `supabase/migrations/` directory into the **SQL Editor** of your production Supabase project.
    - Start with `20260221000000_initial_schema.sql`.
    - Apply all subsequent timestamped `.sql` files in chronological order.
2.  **Verify RLS**: 
    Ensure Row Level Security is enabled on all tables (profiles, leave_applications, ipcr_forms, etc.).

## 3. Vercel Deployment
1.  **Import Project**: 
    Connect your GitHub account to Vercel and import the `hris-portal` repository.
2.  **Configure Environment Variables**:
    Add the following keys in the Vercel Dashboard (**Project Settings > Environment Variables**):
    - `NEXT_PUBLIC_SUPABASE_URL`: Your production project URL.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your production public anon key.
    - `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL (e.g., `https://pao-hrms.vercel.app`).
    - `RESEND_API_KEY`: Your production email API key.
    - `CRON_SECRET`: A long, random string to secure your cron endpoints.
3.  **Build Settings**: 
    Keep default settings (Framework: Next.js).
4.  **Deploy**: 
    Click **Deploy**. Vercel will run `npm run build` automaticallly.

## 4. Post-Deployment: Data Seeding
1.  **Configure Local Production Access**:
    Temporarily update your local `.env.local` to point to the **Production** Supabase project.
    - Set `SUPABASE_SERVICE_ROLE_KEY` to the production secret key.
2.  **Run Seeding Script**:
    ```bash
    npx tsx scripts/seed-users.ts
    ```
    *Note: This creates the initial 30 accounts and their corresponding profiles.*

## 5. PWA Installation
Once deployed, open the site on an Android or iOS device. 
- **iOS**: Tap "Share" -> "Add to Home Screen".
- **Android**: Tap the "Install App" prompt in the browser bar.

## 6. Pre-Launch Validation Checklist
- [ ] Run `npm run predeploy` locally to verify build health.
- [ ] Test the Login flow with a seeded account.
- [ ] Verify that the `~offline` page appears when Airplane Mode is on.
- [ ] Test "File Leave" and "Submit IPCR" routes on a mobile device.

---
**Security Reminder**: Never expose the `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_` variables or client-side code.
