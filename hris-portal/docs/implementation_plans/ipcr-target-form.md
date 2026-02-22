# Implementation Plan: IpcrTargetForm Component

## 1. Overview
The `IpcrTargetForm` allows employees to manage their Individual Performance Commitment and Review (IPCR) targets. It handles both the initial "Commitment" phase (Target Setting) and the subsequent "Review" phase (Evaluation).

## 2. Component Structure
- **Container**: Main form container using `react-hook-form`.
- **Category Sections**: Three distinct sections for 'Strategic Priority', 'Core Function', and 'Support Function'.
- **Target Row (Responsive Grid)**:
  - **Column 1 (Description)**: MFO/PAP and Success Indicator textareas.
  - **Column 2 (Evaluation)**: Actual Accomplishments textarea and QET rating inputs.
  - **Column 3 (Summary)**: Row average and delete action.
- **Controls**: "Add Target" buttons per category and a global "Save" trigger.

## 3. State Management
- **Library**: `react-hook-form` with `useFieldArray`.
- **Schema**:
  ```typescript
  interface IpcrFormValues {
    targets: Array<{
      id?: string;
      category: 'Strategic' | 'Core' | 'Support';
      mfo_pap: string;
      success_indicator: string;
      actual_accomplishment: string;
      rating_q: number;
      rating_e: number;
      rating_t: number;
    }>;
  }
  ```
- **Grouping**: We will filter the `fields` from `useFieldArray` by category for display, or use three separate `useFieldArray` hooks (one per category) for simpler rendering logic.

## 4. UI/UX & Tailwind Strategy
- **Grid Layout**: `grid-cols-1 lg:grid-cols-12` to ensure stacking on mobile.
- **Calculations**: Watch the rating fields in real-time to update the row average.
- **Form Controls**: 
  - `isReviewPhase = false`: `actual_accomplishment` and `rating_*` fields are `disabled`.
  - `isReviewPhase = true`: all fields editable.
- **Micro-animations**: Transition effects when adding/removing rows.

## 5. Verification Checklist
- [ ] Multiple targets can be added to each category.
- [ ] "Remove" button correctly deletes the specific row.
- [ ] Average calculation handles zeros/nulls (e.g., if only Q is provided).
- [ ] `isReviewPhase` correctly toggles field availability.
- [ ] TypeScript strict check passes.
