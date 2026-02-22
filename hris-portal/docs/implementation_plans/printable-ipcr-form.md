# Implementation Plan: PrintableIpcrForm Component

## 1. Overview
The `PrintableIpcrForm` is designed to generate a standardized, print-ready document for the Individual Performance Commitment and Review (IPCR). It strictly follows the Philippine Civil Service Commission (CSC) format.

## 2. Table Structure & Grouping
- **Column Layout**:
  - MFO / PAP (20% width)
  - Success Indicators (25% width)
  - Actual Accomplishments (25% width)
  - Q (5% width)
  - E (5% width)
  - T (5% width)
  - Average (15% width)
- **Categorization**: Data will be pre-sorted or filtered into 'Strategic', 'Core', and 'Support' sections within the table body.

## 3. Print-Specific Styling (Tailwind)
- **Orientation**: Inject a style block for `@media print { @page { size: legal landscape; } }`.
- **Borders**: All table elements will use `border-black` and `border-collapse`.
- **Typography**: Base font size set to `text-[10px]` or `text-[11px]` to accommodate wide content.
- **Page Breaks**: Apply `break-inside-avoid` to category headers and signatory blocks.

## 4. Signatory Block
- A 4-column balanced grid containing:
  - **Ratee**: The staff member.
  - **Immediate Supervisor**: (Configurable placeholder or specific role).
  - **Department Head**: (Configurable placeholder).
  - **Head of Agency**: (Configurable placeholder).

## 5. Verification Checklist
- [ ] Table spans full width without horizontal clipping.
- [ ] "Q", "E", "T" ratings display correctly from data.
- [ ] Average calculation matches the one in the input form.
- [ ] Signatory labels appear correctly at the bottom of the last page.
- [ ] Header includes the commit statement with employee name and period.
