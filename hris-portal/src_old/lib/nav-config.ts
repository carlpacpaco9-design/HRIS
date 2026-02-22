
export type NavItem = {
    label: string
    href: string
    icon: string
    roles: string[]
}

export type NavSection = {
    section: string
    items: NavItem[]
}

export const normalizeRole = (role: string): string => {
    return role.toLowerCase().replace(/ /g, '_')
}

export const navConfig: NavSection[] = [
    {
        section: "MAIN",
        items: [
            {
                label: "Dashboard",
                href: "/dashboard",
                icon: "LayoutDashboard",
                roles: ["project_staff", "division_chief", "head_of_office", "admin_staff"]
            }
        ]
    },
    {
        section: "MODULES",
        items: [
            {
                label: "Daily Time Record",
                href: "/dashboard/dtr",
                icon: "Clock",
                roles: ["project_staff", "division_chief", "head_of_office", "admin_staff"]
            },
            {
                label: "Leaves",
                href: "/dashboard/leaves",
                icon: "CalendarOff",
                roles: ["project_staff", "division_chief", "head_of_office", "admin_staff"]
            },
            {
                label: "Approvals",
                href: "/dashboard/approvals",
                icon: "CheckSquare",
                roles: ["division_chief", "head_of_office", "admin_staff"]
            }
        ]
    },
    {
        section: "SPMS",
        items: [
            {
                label: "IPCR",
                href: "/dashboard/ipcr",
                icon: "FileText",
                roles: ["project_staff", "division_chief", "head_of_office", "admin_staff"]
            },
            {
                label: "OPCR",
                href: "/dashboard/opcr",
                icon: "Building2",
                roles: ["division_chief", "head_of_office", "admin_staff"]
            },
            {
                label: "Monitoring & Coaching",
                href: "/dashboard/monitoring",
                icon: "BookOpen",
                roles: ["division_chief", "head_of_office", "admin_staff"]
            },
            {
                label: "Development Plan",
                href: "/dashboard/development-plan",
                icon: "TrendingUp",
                roles: ["project_staff", "division_chief", "head_of_office", "admin_staff"]
            },
            {
                label: "SPMS Calendar",
                href: "/dashboard/spms-calendar",
                icon: "CalendarDays",
                roles: ["project_staff", "division_chief", "head_of_office", "admin_staff"]
            },
            {
                label: "Rewards & Incentives",
                href: "/dashboard/rewards",
                icon: "Trophy",
                roles: ["project_staff", "division_chief", "head_of_office", "admin_staff"]
            }
        ]
    },
    {
        section: "ADMINISTRATION",
        items: [
            {
                label: "User Management",
                href: "/dashboard/admin/users",
                icon: "Users",
                roles: ["head_of_office", "admin_staff"]
            },
            {
                label: "Admin Panel",
                href: "/dashboard/admin",
                icon: "ShieldCheck",
                roles: ["head_of_office", "admin_staff"]
            }
        ]
    }
]
