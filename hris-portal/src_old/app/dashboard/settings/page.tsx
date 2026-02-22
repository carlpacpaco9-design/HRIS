import { getSettingsData } from "@/app/actions/settings"
import { SettingsContent } from "@/components/settings/settings-content"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const data = await getSettingsData()

    if (!data) {
        redirect('/login')
    }

    return (
        <SettingsContent
            user={data.user}
            profile={data.profile}
        />
    )
}
