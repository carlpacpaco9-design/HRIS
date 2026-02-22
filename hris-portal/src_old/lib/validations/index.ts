import * as z from "zod"

export const leaveSchema = z.object({
    leave_type: z.enum([
        "vacation", "sick", "emergency",
        "maternity", "paternity", "special"
    ] as const, { message: "Leave type is required" }),
    date_from: z.string().min(1, "Start date is required"),
    date_to: z.string().min(1, "End date is required"),
    reason: z.string()
        .min(10, "Please provide at least 10 characters")
        .max(500, "Reason must not exceed 500 characters"),
    is_half_day: z.boolean(),
}).refine(
    (data) => new Date(data.date_to) >= new Date(data.date_from),
    { message: "End date must be after start date", path: ["date_to"] }
)

export type LeaveFormValues = z.infer<typeof leaveSchema>

export const targetSchema = z.object({
    mfo_category: z.enum(["strategic", "core", "support"]),
    output: z.string().min(5, "Output description is too short"),
    indicators: z.string().min(10, "Success indicators are required"),
    timeline: z.string().optional(),
})

export type TargetFormValues = z.infer<typeof targetSchema>

export const dtrSchema = z.object({
    staff_id: z.string().min(1, "Staff member is required"),
    date: z.string().min(1, "Date is required"),
    am_arrival: z.string().optional(),
    am_departure: z.string().optional(),
    pm_arrival: z.string().optional(),
    pm_departure: z.string().optional(),
    remarks: z.string().max(200, "Remarks must be 200 characters or less").optional(),
})

export type DTRFormValues = z.infer<typeof dtrSchema>

export const ipcrSchema = z.object({
    rating_period_id: z.string().min(1, "Rating period is required"),
    division_id: z.string().min(1, "Division is required"),
    immediate_supervisor_id: z.string().optional(),
    period_from: z.string().optional(),
    period_to: z.string().optional(),
    final_average_rating: z.number().optional(),
    outputs: z.array(z.object({
        category: z.enum(['strategic_priority', 'core_function']),
        output_title: z.string().min(1, "Output title is required"),
        success_indicator: z.string().min(1, "Success indicator is required"),
        actual_accomplishments: z.string().optional(),
        rating_q: z.number().min(1).max(5).optional(),
        rating_e: z.number().min(1).max(5).optional(),
        rating_t: z.number().min(1).max(5).optional(),
        rating_average: z.number().optional(),
        remarks: z.string().optional(),
    })).min(1, "At least one output is required").max(10, "Maximum 10 outputs allowed"),
    comments: z.string().optional(),
})

export type IPCRFormValues = z.infer<typeof ipcrSchema>
