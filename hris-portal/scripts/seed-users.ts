/**
 * SEED USERS SCRIPT
 * 
 * Objective: Batch-create initial accounts in Supabase Auth and Public.Profiles.
 * Usage: npx tsx scripts/seed-users.ts
 * 
 * SECURITY WARNING: 
 * This script uses the SERVICE_ROLE_KEY to bypass RLS. 
 * NEVER commit your .env file or the service role key to version control.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// 1. Configuration & Client Setup
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local.')
    process.exit(1)
}

// Initialize Admin Client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// 2. Data Structures
interface SeedEmployee {
    email: string
    firstName: string
    lastName: string
    position: string
    division: string
    employmentStatus: 'Permanent' | 'Casual' | 'Job Order' | 'Contract of Service'
    role: 'head_of_office' | 'admin_staff' | 'division_chief' | 'project_staff'
}

const INITIAL_PASSWORD = 'ChangeMe2026!'

// Mock Data (Test Set)
const SEED_DATA: SeedEmployee[] = [
    {
        email: 'admin.hr@ilocossur.gov.ph',
        firstName: 'Maria',
        lastName: 'Santos',
        position: 'Administrative Officer V',
        division: 'Administrative Division',
        employmentStatus: 'Permanent',
        role: 'admin_staff'
    },
    {
        email: 'juan.valdez@ilocossur.gov.ph',
        firstName: 'Juan',
        lastName: 'Valdez',
        position: 'Assessment Clerk II',
        division: 'Tax Mapping Division',
        employmentStatus: 'Permanent',
        role: 'project_staff'
    },
    {
        email: 'elena.cruz@ilocossur.gov.ph',
        firstName: 'Elena',
        lastName: 'Cruz',
        position: 'Data Encoder',
        division: 'Records Division',
        employmentStatus: 'Job Order',
        role: 'project_staff'
    }
]

// 3. Execution Logic
async function seedUsers() {
    console.log('🚀 Starting User Seeding Process...')
    let successCount = 0
    let skipCount = 0

    for (const employee of SEED_DATA) {
        try {
            // Step A: Idempotency Check - Does user already exist in Auth?
            const { data: existingUser } = await supabase.auth.admin.listUsers()
            const authUser = existingUser?.users.find(u => u.email === employee.email)

            let userId: string

            if (authUser) {
                console.log(`- User [${employee.email}] already exists in Auth. Skipping creation.`)
                userId = authUser.id
                skipCount++
            } else {
                // Step B: Create Auth User
                const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
                    email: employee.email,
                    password: INITIAL_PASSWORD,
                    email_confirm: true,
                    user_metadata: {
                        full_name: `${employee.firstName} ${employee.lastName}`
                    }
                })

                if (authError) throw authError
                userId = newUser.user!.id
                console.log(`✅ Auth created for [${employee.email}]`)
                successCount++
            }

            // Step C: Upsert Profile Data (Bypass RLS)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: `${employee.firstName} ${employee.lastName}`,
                    position: employee.position,
                    division: employee.division,
                    role: employee.role,
                    employment_status: employee.employmentStatus,
                    is_active: true
                })

            if (profileError) throw profileError
            console.log(`   └─ Profile synchronized for UID: ${userId}`)

        } catch (err: any) {
            console.error(`❌ Error processing [${employee.email}]:`, err.message)
        }
    }

    console.log('\n--- SEEDING COMPLETE ---')
    console.log(`Total Processed: ${SEED_DATA.length}`)
    console.log(`New Creations  : ${successCount}`)
    console.log(`Skips/Updates  : ${skipCount}`)
}

seedUsers().catch(console.error)
