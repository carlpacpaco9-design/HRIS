import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@assessor.gov.ph'
const FROM_NAME = Deno.env.get('FROM_NAME') ?? "Provincial Assessor's Office HRMS"

serve(async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    try {
        const { to, recipient_name, type, title, message, action_url } =
            await req.json()

        if (!to || !title || !message) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: to, title, message' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const html = buildEmailHTML({ recipient_name: recipient_name ?? 'User', title, message, action_url, type })

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: [to],
                subject: title,
                html,
            }),
        })

        const result = await response.json()

        return new Response(JSON.stringify(result), {
            status: response.ok ? 200 : 500,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})

// ── Email HTML Builder ────────────────────────────────────────────────────────

function buildEmailHTML(params: {
    recipient_name: string
    title: string
    message: string
    action_url?: string
    type: string
}): string {
    const icons: Record<string, string> = {
        'ipcr.finalized': '📋',
        'leave.filed': '📅',
        'leave.approved': '✅',
        'leave.rejected': '❌',
        'opcr.submitted': '🏢',
        'monitoring.submitted': '📊',
        'monitoring.noted': '✅',
        'reward.given': '🏆',
        'spms.deadline': '⏰',
        'development_plan.created': '📈',
    }
    const icon = icons[params.type] ?? '🔔'

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background: #1E3A5F; padding: 24px 32px; text-align: center;">
      <p style="color: #F59E0B; font-size: 12px; font-weight: 600; letter-spacing: 1px; margin: 0 0 8px 0; text-transform: uppercase;">
        Provincial Assessor's Office
      </p>
      <p style="color: white; font-size: 14px; margin: 0; opacity: 0.8;">
        HRMS Portal Notification
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="font-size: 32px; margin: 0 0 16px 0; text-align: center;">${icon}</p>

      <h2 style="color: #1E3A5F; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
        ${params.title}
      </h2>

      <p style="color: #64748B; font-size: 12px; margin: 0 0 20px 0;">
        Dear ${params.recipient_name},
      </p>

      <div style="background: #F8FAFC; border-left: 4px solid #1E3A5F; border-radius: 0 6px 6px 0; padding: 16px; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">
          ${params.message}
        </p>
      </div>

      ${params.action_url
            ? `<div style="text-align: center; margin-bottom: 24px;">
             <a href="${params.action_url}" style="background: #1E3A5F; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
               View in Portal →
             </a>
           </div>`
            : ''}
    </div>

    <!-- Footer -->
    <div style="background: #F1F5F9; padding: 16px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
      <p style="color: #94A3B8; font-size: 11px; margin: 0 0 4px 0;">
        This is an automated notification from the HRMS Portal.
      </p>
      <p style="color: #94A3B8; font-size: 11px; margin: 0;">
        Provincial Assessor's Office — Human Resource Management System
      </p>
    </div>

  </div>
</body>
</html>`
}
