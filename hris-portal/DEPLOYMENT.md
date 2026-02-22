# PAO HRMS — Deployment Guide
Sprint 2 Final Release

## Prerequisites
- Node.js 18+
- Supabase project (PostgreSQL)
- Environment variables configured

## Setup Steps

### 1. Database Setup
Run all migrations in order:
`npx supabase db push`

Migrations:
- 20260221000000_initial_schema.sql
- 20260221000001_opcr_outputs.sql
- 20260221000002_rls_hardening.sql

### 2. Create First Admin User
In Supabase Dashboard:
1. Go to Authentication > Users
2. Create user with email + password
3. In SQL Editor, run:
```sql
   INSERT INTO profiles (
     id, full_name, email,
     position, division, role,
     employment_status, is_active
   ) VALUES (
     '[auth user id]',
     'Administrator Name',
     'admin@pao.gov.ph',
     'Administrative Officer',
     'Administrative Division',
     'admin_staff',
     'Permanent',
     true
   );
```

### 3. Initialize System
After logging in as admin:
1. Go to SPMS Calendar
2. Create first SPMS cycle
3. Set it as active
4. Go to Admin Panel
5. Initialize leave balances for current year

### 4. Add Employees
Go to User Management and create employee accounts with temporary passwords.

## Environment Variables
See `.env.local.example`

## Role Reference
| DB Role | Display |
|---------|---------|
| head_of_office | Provincial Assessor |
| admin_staff | HR/Admin Staff |
| division_chief | Division Chief |
| project_staff | Regular Employee |

## Module Access Matrix
[Reference permissions.ts]
