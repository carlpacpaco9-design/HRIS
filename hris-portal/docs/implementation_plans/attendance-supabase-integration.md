# Integration Plan: Supabase Attendance Layer

## 1. Overview
Connect the `MonthlyForm48View` component to the production Supabase backend. This involves creating a specialized data fetching hook, updating the view to handle asynchronous states, and building an administrative selector for the 30-person roster.

## 2. Data Fetching Strategy
- **Hook**: `src/hooks/use-attendance-data.ts`
- **Query**: Filter `daily_time_records` by `employee_id` and a date range covering the targeted `YYYY-MM`.
- **Mapping**: Transform Supabase rows (snake_case) to the `DailyPunch` interface (camelCase) used by the logic layer.
- **Empty States**: Generate a complete calendar of 31 days even if zero records are returned, ensuring a valid (though empty) Form 48 is displayed.

## 3. Component Updates
### `MonthlyForm48View.tsx`
- Remove all `useEffect` mock loops.
- Accept a `records: DailyPunch[]` prop (or use the hook internally).
- Implement a `Skeleton` or `Spinner` for the `isLoading` state.
- Handle `isError` with a user-friendly alert.

### `AdminAttendanceDashboard.tsx` (New)
- **Roster Fetch**: Fetch all active users from the `profiles` (or `employees`) table.
- **State Selection**:
  - `selectedEmployee`: `string` (UUID)
  - `selectedMonth`: `string` (YYYY-MM)
- **Visibility**: Wrap selector controls in `print:hidden` to ensure a clean print output of the Form 48.

## 4. Technical Constraints Alignment
- **Normalization**: Ensure time formats (TIME) from Postgres are correctly parsed as `HH:mm`.
- **Optimization**: The employee list will be fetched server-side or via a cached client call to prevent flicker during month switching.
- **Type Safety**: Strictly typed using the generated Supabase database types.

## 5. Timeline
1. Create `use-attendance-data.ts` hook.
2. Build `AdminAttendanceDashboard` component.
3. Refactor `MonthlyForm48View` for production data.
4. Final Verification (Build & TSC).
