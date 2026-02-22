// Migrated from Sprint 1
// Official working hours
export const OFFICIAL_TIMES = {
    AM_ARRIVAL: '08:00',
    AM_DEPARTURE: '12:00',
    PM_ARRIVAL: '13:00',
    PM_DEPARTURE: '17:00',
} as const

export function calculateUndertime(
    amArrival: string,
    amDeparture: string,
    pmArrival: string,
    pmDeparture: string
): { hours: number; minutes: number } {
    let undertimeMinutes = 0

    const toMinutes = (time: string) => {
        const [h, m] = time.substring(0, 5).split(':').map(Number)
        return (h || 0) * 60 + (m || 0)
    }

    // Late AM arrival
    if (amArrival > OFFICIAL_TIMES.AM_ARRIVAL) {
        undertimeMinutes +=
            toMinutes(amArrival) -
            toMinutes(OFFICIAL_TIMES.AM_ARRIVAL)
    }
    // Early AM departure
    if (amDeparture < OFFICIAL_TIMES.AM_DEPARTURE) {
        undertimeMinutes +=
            toMinutes(OFFICIAL_TIMES.AM_DEPARTURE) -
            toMinutes(amDeparture)
    }
    // Late PM arrival
    if (pmArrival > OFFICIAL_TIMES.PM_ARRIVAL) {
        undertimeMinutes +=
            toMinutes(pmArrival) -
            toMinutes(OFFICIAL_TIMES.PM_ARRIVAL)
    }
    // Early PM departure
    if (pmDeparture < OFFICIAL_TIMES.PM_DEPARTURE) {
        undertimeMinutes +=
            toMinutes(OFFICIAL_TIMES.PM_DEPARTURE) -
            toMinutes(pmDeparture)
    }

    return {
        hours: Math.floor(undertimeMinutes / 60),
        minutes: undertimeMinutes % 60,
    }
}
