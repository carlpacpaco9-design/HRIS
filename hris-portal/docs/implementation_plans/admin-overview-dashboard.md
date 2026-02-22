# Implementation Plan: Admin Overview Dashboard Analytics

## 1. Data Fetching Strategy (`useDashboardAnalytics.ts`)
We will utilize `Promise.all()` to execute four independent Supabase queries concurrently. This minimizes the total loading time to the duration of the slowest single query.

### Concurrent Queries:
1. **Roster Status**: 
   - Get total count of active `profiles`.
2. **Attendance Pulse**: 
   - Count records in `daily_time_records` for `CURRENT_DATE` where `am_in` is NOT NULL.
3. **Leave Pipeline**:
   - Count `leave_applications` where `status = 'Pending'`.
4. **Current Absences**:
   - Count `leave_applications` where `status = 'Approved'` AND `CURRENT_DATE` is within the date range. *(Note: Since inclusive_dates is currently stored as TEXT in schema, we will perform a pattern match or approximate check for this version, or update logic to handle date ranges more robustly if needed).*
5. **IPCR Pipeline**:
   - Count `ipcr_forms` where `status IN ('Submitted', 'Reviewed')`.

## 2. Dashboard UI Architecture (`AdminOverviewDashboard.tsx`)
- **KPI Grid**: 4-column responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
- **Cards**: Using Shadcn `Card` components with large typography (`text-3xl font-black`).
- **State Indicators**: 
  - Amber highlights for non-zero pending actions.
  - Green/Neutral for attendance stats.
- **Interactivity**: KPI cards act as navigation triggers to their respective detail pages.

## 3. Loading Experience
- **Skeletons**: Implement `Skeleton` primitives for each KPI card to maintain layout stability.
- **Error Handling**: Graceful fallback to `0` or `Err` indicators if a specific query fails.

## 4. Verification Checklist
- [ ] Present Today reflects actual `am_in` punches.
- [ ] Pending counts match what's shown in detail dashboards.
- [ ] Mobile view stacks cards into a single column.
- [ ] Clicking a pending card correctly routes to `/dashboard/admin/leave` or `/dashboard/admin/ipcr-approvals`.
