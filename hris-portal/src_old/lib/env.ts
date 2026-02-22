// Validates all required env vars at startup
// Throws clear error if any are missing

const required = {
    server: [
        'SUPABASE_SERVICE_ROLE_KEY',
        'CRON_SECRET',
        'RESEND_API_KEY',
    ],
    public: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_APP_URL',
    ]
}

export function validateEnv() {
    if (typeof window !== 'undefined') return // Skip on client

    const missing: string[] = []

    required.server.forEach(key => {
        if (!process.env[key]) missing.push(key)
    })
    required.public.forEach(key => {
        if (!process.env[key]) missing.push(key)
    })

    // Only throw if in production or running locally (but maybe check context)
    // We throw error to fail fast
    if (missing.length > 0) {
        // In development we might want to just warn if local env isn't fully set up yet?
        // User requested "Throws clear error".
        throw new Error(
            `Missing required environment variables:\n${missing.join('\n')}`
        )
    }
}
