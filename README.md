# Family Hub

A family management app for tracking expenses, tasks, appointments, baby logs, shopping lists, and notes. Built with Next.js 16, Supabase, and shadcn/ui.

## Getting started

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once created, go to **Project Settings → API** and copy:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon / public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 2. Set up environment variables

Edit `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the database schema

1. In your Supabase project, go to **SQL Editor**.
2. Open `supabase/schema.sql` from this repo.
3. Paste the full contents and click **Run**.

This creates all tables with Row-Level Security enabled so each family can only see their own data.

### 4. Enable email auth

In Supabase, go to **Authentication → Providers** and make sure **Email** is enabled. For local development, you can disable email confirmation in **Authentication → Email Templates → Confirm signup** (toggle "Enable email confirmations" off).

### 5. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and register your account.

### 6. Invite your partner

After registering, your partner can go to `/register`, create an account, and then (feature: you can share your `family_id` from the database for them to join). A full invite-by-email flow can be added in a future iteration using Supabase's invite user API.

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **Supabase** (PostgreSQL + Auth + Row-Level Security)
- **Tailwind CSS** + **shadcn/ui** (base-ui v4)
- **TypeScript**
- **date-fns** for date formatting
- **lucide-react** for icons

## Features

| Module | Description |
|--------|-------------|
| Dashboard | Overview of all modules at a glance |
| Expenses | Track income and expenses by category with monthly summary |
| Tasks | Household chores with priority, due date, and recurrence |
| Calendar | Monthly calendar view with upcoming appointments |
| Baby | Log feeds, sleep, diaper changes, and milestones |
| Shopping | Multiple lists with real-time item check-off |
| Notes | Tagged notes with search and full-text editing |
