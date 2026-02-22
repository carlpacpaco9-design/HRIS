# Implementation Plan: MonthlyForm48View Component

## 1. Overview
The `MonthlyForm48View` component is designed to render a digital version of the Civil Service Commission (CSC) Form 48. It provides a daily breakdown of an employee's attendance, calculating tardiness and undertime per session, and aggregating monthly totals for official reporting.

## 2. Component Structure
- **Root Container**: `div` with `max-w-4xl`, `mx-auto`, and `p-8`. Layout optimized for both screen display and A4 paper printing.
- **Header**:
  - Employee Name (Large Typography)
  - Selected Month/Period (Sub-header)
  - Office Name (Provincial Assessor's Office)
- **Attendance Table**:
  - `table` with `w-full` and `text-xs` (standard form density).
  - **Thead**: Date, AM In/Out, PM In/Out, Tardiness, Undertime, Remarks.
  - **Tbody**: 31 dynamic rows mapped from calculated state.
- **Footer/Totals**:
  - Summary row for `Total Tardiness`.
  - Summary row for `Total Undertime`.
  - Signature lines for Employee and Supervisor (visible only in print or final view).

## 3. Data Flow & Logic
- **Props**: `employeeId` (string), `month` (string, format: YYYY-MM).
- **Utility Integration**: Uses `calculateMonthlyAttendance` from `@/lib/attendance-calculator.ts`.
- **Mocking Strategy**: 
  - `useEffect` will generate a list of `DailyPunch` objects for every day of the selected month.
  - Punches will be randomly populated with valid times (e.g., 08:05, 12:02, 12:55, 17:01) to demonstrate calculation accuracy.
- **Calculations**:
  - Daily: (Arrival - 8:00) + (Arrival - 13:00).
  - Undertime: (12:00 - Departure) + (17:00 - Departure).

## 4. Styling (Tailwind utility classes)
- **Table**: `border-collapse`, `border-slate-300`, `print:border-black`.
- **Typography**: `font-serif` for official form look, `uppercase` for headers.
- **Visual Cues**: 
  - `bg-red-50` for rows with tardiness/undertime > 0.
  - `text-destructive` for high values.
- **Print Optimization**:
  - `print:hidden` for UI controls (Print buttons, Navigation).
  - `print:p-0`, `print:shadow-none` to ensure clean physical output.
  - `break-inside-avoid`.

## 5. Verification Checklist
- [ ] Correctly handles months with 28, 29, 30, and 31 days.
- [ ] Totals at the bottom match the sum of individual row minutes.
- [ ] "IsIncomplete" status triggers a visual warning or remark.
- [ ] No TypeScript strict mode errors.
