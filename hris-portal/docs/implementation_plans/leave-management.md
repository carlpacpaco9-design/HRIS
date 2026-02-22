# Implementation Plan: Leave Management (CSC Form 6)

## 1. Database Schema (`leave-management.sql`)

### `leave_balances` Table
- `employee_id`: UUID (PK, FK to profiles)
- `vacation_balance`: DECIMAL (default 0)
- `sick_balance`: DECIMAL (default 0)
- `spl_balance`: INT (default 3)
- `updated_at`: TIMESTAMP

### `leave_applications` Table
- `id`: UUID (PK)
- `employee_id`: UUID (FK to profiles)
- `date_filed`: DATE (default now)
- `leave_type`: VARCHAR (Vacation, Sick, SPL, etc.)
- `details_of_leave`: TEXT (JSON or descriptive text)
- `number_of_days`: DECIMAL
- `inclusive_dates`: TEXT
- `commutation`: VARCHAR (Requested, Not Requested)
- `status`: VARCHAR (Pending, Approved, Disapproved)
- `remarks`: TEXT (for disapproval)

### Row Level Security (RLS)
- **Policies**: 
  - `authenticated` users can `SELECT` and `INSERT` their own applications.
  - `authenticated` users can `SELECT` their own balances.
  - `admin_staff` can `SELECT`, `UPDATE`, `DELETE` all records.

## 2. Frontend Component (`LeaveApplicationForm.tsx`)

### State & Validation
- **Library**: `react-hook-form` + `zod`.
- **Validation**:
  - Required fields check.
  - `number_of_days` must not exceed available balance for the selected type.
- **Conditional Logic**:
  - If type is "Vacation", show "Location" options.
  - If type is "Sick", show "Medical Details" options.

### UI Layout (Tailwind)
- **Top Bar**: Summary cards showing current VL, SL, and SPL credits.
- **Form Body**:
  - Two-column grid for major selections.
  - Specific "Details" section that updates based on selection.
  - Touch-friendly date inputs and custom radio groups.

## 3. Workflow
1. User selects Leave Type.
2. System fetches/checks current balance.
3. User enters dates and duration.
4. Validation prevents submission if duration > balance.
5. On success, application is saved as 'Pending'.
