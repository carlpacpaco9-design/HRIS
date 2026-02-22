export type ActionResult<T = void> =
    | { success: true; data: T; error?: never }
    | { success: false; error: string; data?: never }

export function ok<T>(data: T): ActionResult<T> {
    return { success: true, data }
}

export function err(error: string): ActionResult<never> {
    return { success: false, error }
}
