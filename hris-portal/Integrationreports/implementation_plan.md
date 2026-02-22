# Implementation Plan: HRMS Assessors Office Portal

This document outlines the phased approach to refining the HRMS Portal, focusing on stability, type safety, performance, and user experience.

## Phase 1: Foundation & Type Safety (Immediate Priority)
**Goal:** Eliminate potential runtime errors and improve developer experience by enforcing strict TypeScript definitions.

1.  **Define Core Interfaces**
    *   Create `src/types/dashboard.ts` (or similar) to centralize types.
    *   Define `IPCRCommitment`, `AttendanceLog`, `LeaveBalance`, and `UserProfile` interfaces.
    *   Replace all usages of `any` in `src/app/dashboard/page.tsx` and related components (`IPCRCard`, `AttendanceWidget`, etc.).
2.  **Audit Component Props**
    *   Update `IPCRCard`, `ApprovalsCard`, `TeamCard`, and `AttendanceWidget` to accept typed props instead of `any` or loose objects.
    *   Ensure strict null checks are handled (e.g., `commitment?.rating` vs `commitment.rating`).

## Phase 2: Architectural Consistency (Server-Side Migration)
**Goal:** Unify data fetching strategies to leverage Next.js App Router's full potential and eliminate "pop-in" loading states.

1.  **Refactor Attendance Data Fetching**
    *   Create a new server action or utility function `getAttendanceLogs(userId)` in `src/app/actions/attendance.ts`.
    *   Move the logic from `AttendanceWidget.tsx` (client-side `useEffect`) to `DashboardPage` (server-side `await`).
    *   Pass the fetched logs directly to `AttendanceWidget` as props.
2.  **Optimize Dashboard Data Loading**
    *   Review `Promise.all` in `DashboardPage`. Ensure all new server-side calls are included here to maintain parallel fetching.
    *   Verify that `dynamic = 'force-dynamic'` is strictly necessary for all parts, or if some data can be cached.

## Phase 3: Error Handling & Resilience
**Goal:** Prevent the entire dashboard from crashing if a single service (e.g., Database, Third-party API) fails.

1.  **Granular Error Handling**
    *   Wrap individual data fetching calls in `try-catch` blocks within the server components.
    *   Return "fallback" data (e.g., empty arrays or specific error flags) instead of throwing undefined errors.
2.  **UI Error Boundaries**
    *   Implement error states within widgets (e.g., if `IPCRData` fails, show "Stats unavailable" card instead of crashing).
    *   Create a `error.tsx` file for the `/dashboard` route as a catch-all safety net.

## Phase 4: Optimization & UI Polish
**Goal:** Enhance perceived performance and accessibility.

1.  **Streaming with Suspense**
    *   Instead of waiting for *everything* to load via `Promise.all` at the top level, break down the dashboard.
    *   Wrap slow-loading widgets (like `TeamCard` or `AttendanceWidget` if they become heavy) in `<Suspense fallback={<Skeleton />}>`.
    *   Allow the simpler "Welcome" header and fast data to load immediately.
2.  **Scrollbar & Accessibility**
    *   Revisit `globals.css` to remove `*::-webkit-scrollbar { display: none; }`.
    *   Implement a custom, slim, branded scrollbar that is visible but not intrusive.
    *   Ensure all interactive elements have proper `aria-labels` where icons are used without text.

## Phase 5: Future-Proofing (Enhancements)
**Goal:** Prepare for scale.
1.  **Pagination/Load More**: Implement for Attendance Logs and Team Approvals lists.
2.  **Form Validation**: Apply Zod schemas to the "Request DTR Correction" dialog.
