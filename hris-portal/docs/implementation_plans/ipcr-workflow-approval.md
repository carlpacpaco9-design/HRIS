# Implementation Plan: IPCR Workflow & Approval Dashboard

## 1. Overview
The IPCR Workflow system facilitates the submission, review, and approval of performance commitment forms. It provides admins with a centralized dashboard to inspect employee targets and manage their lifecycle status.

## 2. Data Fetching & Mutations (`useIpcrWorkflow.ts`)
- **Query**: Fetch `ipcr_forms` joined with `profiles` (for employee names) and `ipcr_periods` (for semester context).
- **Filtering**: Focus on forms with status `Submitted` or `Reviewed` for the approval dashboard.
- **Mutations**:
  - `submitIpcr(formId)`: Transitions from `Draft` -> `Submitted`.
  - `approveIpcr(formId)`: Transitions to `Approved`.
  - `returnIpcr(formId, remarks)`: Transitions back to `Draft` (or a specific `Returned` status) with feedback logged.
- **State Management**: Use `useState` for local form list and `mutate` patterns for optimistic UI updates.

## 3. Component Architecture
- **`IpcrApprovalDashboard.tsx`**:
  - **Table View**: Summarized list of pending IPCRs.
  - **Inspect Modal**: A `Dialog` containing the `IpcrTargetForm` in read-only mode for the admin.
  - **Action Toolbar**: Floating/Sticky footer in the modal for "Approve" and "Return".
- **`StatusBadge.tsx`**: Lightweight utility for consistent status styling.

## 4. Technical Constraints Alignment
- **TypeScript**: Strict definition for the nested Supabase join:
  ```typescript
  type IpcrWithProfile = IpcrForm & {
    profiles: { first_name: string; last_name: string; };
    ipcr_periods: { year: number; semester: number; };
  }
  ```
- **UX**: Button loading states via `isPending` states and clear `toast` feedback.

## 5. Verification Checklist
- [ ] Joined query correctly displays full name of employee.
- [ ] Status updates reflect immediately in the dashboard list.
- [ ] Inspection view is correctly disabled for the admin review.
- [ ] "Return" requires a remark to be entered (simple prompt or modal field).
