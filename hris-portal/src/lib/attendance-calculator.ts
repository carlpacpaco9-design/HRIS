/**
 * AttendanceCalculator.ts
 * Robust utility for Civil Service Commission (CSC) Form 48 calculations.
 * Handles government standard hours: 8-12, 1-5.
 */

export interface DailyPunch {
    date: string;
    amIn?: string;
    amOut?: string;
    pmIn?: string;
    pmOut?: string;
    remarks?: string;
}

export interface DailyCalculation {
    date: string;
    amIn?: string;
    amOut?: string;
    pmIn?: string;
    pmOut?: string;
    tardinessMinutes: number;
    undertimeMinutes: number;
    isIncomplete: boolean;
    remarks: string;
}

export interface MonthlySummary {
    days: DailyCalculation[];
    totalTardiness: number;
    totalUndertime: number;
}

// Standard Government Hours (Minutes from midnight)
const AM_LIMIT_IN = 8 * 60;      // 08:00
const AM_LIMIT_OUT = 12 * 60;    // 12:00
const PM_LIMIT_IN = 13 * 60;     // 13:00
const PM_LIMIT_OUT = 17 * 60;    // 17:00
const SESSION_DURATION = 4 * 60; // 240 minutes

/**
 * Converts "HH:mm" string to total minutes from midnight.
 */
const timeToMinutes = (time?: string): number | null => {
    if (!time || !time.includes(':')) return null;
    const parts = time.split(':')
    if (parts.length < 2) return null;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
};

/**
 * Calculates tardiness and undertime for a single day based on CSC rules.
 */
export const calculateDailyAttendance = (punch: DailyPunch): DailyCalculation => {
    const { date, amIn, amOut, pmIn, pmOut, remarks = "" } = punch;

    // 1. Check for official excuses (Leave, OB, Absent with remarks)
    const isExcused = /Leave|OB|Absent/i.test(remarks);
    if (isExcused) {
        return {
            date,
            tardinessMinutes: 0,
            undertimeMinutes: 0,
            isIncomplete: false,
            remarks
        };
    }

    const amInMin = timeToMinutes(amIn);
    const amOutMin = timeToMinutes(amOut);
    const pmInMin = timeToMinutes(pmIn);
    const pmOutMin = timeToMinutes(pmOut);

    let tardiness = 0;
    let undertime = 0;
    let isIncomplete = false;

    // 2. AM Session Logic
    if (amInMin !== null && amOutMin !== null) {
        // Both punches exist
        if (amInMin > AM_LIMIT_IN) tardiness += (amInMin - AM_LIMIT_IN);
        if (amOutMin < AM_LIMIT_OUT) undertime += (AM_LIMIT_OUT - amOutMin);
    } else if (amInMin === null && amOutMin === null) {
        // No AM punches: Check if PM exists (Half-day logic)
        if (pmInMin !== null || pmOutMin !== null) {
            undertime += SESSION_DURATION; // Count entire AM session as undertime/absent
        } else {
            // Entire day missing and no remarks - potentially an unrecorded absence
            // We count as 0 for DTR calculation but mark as incomplete/absent for the admin to review
            isIncomplete = true;
        }
    } else {
        // One punch missing - Incomplete
        isIncomplete = true;
        if (amInMin !== null && amInMin > AM_LIMIT_IN) tardiness += (amInMin - AM_LIMIT_IN);
        if (amOutMin !== null && amOutMin < AM_LIMIT_OUT) undertime += (AM_LIMIT_OUT - amOutMin);
    }

    // 3. PM Session Logic
    if (pmInMin !== null && pmOutMin !== null) {
        // Both punches exist
        if (pmInMin > PM_LIMIT_IN) tardiness += (pmInMin - PM_LIMIT_IN);
        if (pmOutMin < PM_LIMIT_OUT) undertime += (PM_LIMIT_OUT - pmOutMin);
    } else if (pmInMin === null && pmOutMin === null) {
        // No PM punches: If AM exists, count PM session as undertime
        if (amInMin !== null || amOutMin !== null) {
            undertime += SESSION_DURATION;
        }
    } else {
        // One punch missing - Incomplete
        isIncomplete = true;
        if (pmInMin !== null && pmInMin > PM_LIMIT_IN) tardiness += (pmInMin - PM_LIMIT_IN);
        if (pmOutMin !== null && pmOutMin < PM_LIMIT_OUT) undertime += (PM_LIMIT_OUT - pmOutMin);
    }

    return {
        date,
        amIn,
        amOut,
        pmIn,
        pmOut,
        tardinessMinutes: tardiness,
        undertimeMinutes: undertime,
        isIncomplete,
        remarks
    };
};

/**
 * Aggregates monthly calculations into a summary for Form 48.
 */
export const calculateMonthlyAttendance = (punches: DailyPunch[]): MonthlySummary => {
    const dailyStats = punches.map(calculateDailyAttendance);

    const totals = dailyStats.reduce(
        (acc, day) => {
            acc.totalTardiness += day.tardinessMinutes;
            acc.totalUndertime += day.undertimeMinutes;
            return acc;
        },
        { totalTardiness: 0, totalUndertime: 0 }
    );

    return {
        days: dailyStats,
        ...totals
    };
};
