// @deno-types="npm:@types/web-push@3.6.4"
import webPush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.119.2'

const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const cronSecret = Deno.env.get('POCKETPULSE_CRON_SECRET') ?? ''
const table = 'pocketpulse_reminders'
const jakartaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' })

function trustedEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint)
    return url.protocol === 'https:' && !url.port && !url.username && !url.password && !url.hash
      && (['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'].includes(url.hostname)
        || url.hostname.endsWith('.push.apple.com') || url.hostname.endsWith('.notify.windows.com'))
  } catch { return false }
}

Deno.serve(async request => {
  if (request.method === 'GET') {
    return Response.json({ publicKey }, {
      status: publicKey ? 200 : 503, headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
    })
  }
  if (request.method !== 'POST' || !cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response(null, { status: 401 })
  }
  if (!publicKey || !privateKey) return new Response(null, { status: 503 })
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const day = jakartaDay.format(new Date())
  const notSent = `last_sent_on.is.null,last_sent_on.lt.${day}`
  let sent = 0
  let failed = 0
  const { data, error } = await db.from(table).select('endpoint, p256dh, auth_key, language').or(notSent).limit(200)
  if (error) return new Response(null, { status: 500 })
  for (let index = 0; index < data.length; index += 10) {
    await Promise.all(data.slice(index, index + 10).map(async row => {
      if (!trustedEndpoint(row.endpoint)) {
        await db.from(table).delete().eq('endpoint', row.endpoint)
        return
      }
      const { data: claimed, error: claimError } = await db.from(table).update({ last_sent_on: day }).eq('endpoint', row.endpoint)
        .or(notSent).select('endpoint').maybeSingle()
      if (claimError) { failed += 1; return }
      if (!claimed) return
      try {
        await webPush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth_key } },
          JSON.stringify({ type: 'pocketpulse-nightly', language: row.language }), {
            vapidDetails: { subject: 'https://pocketpulse-git-dev-raphchristophr.vercel.app/', publicKey, privateKey },
            TTL: 3600, timeout: 8000,
          })
        sent += 1
      } catch (failure) {
        failed += 1
        const status = (failure as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await db.from(table).delete().eq('endpoint', row.endpoint)
      }
    }))
  }
  return Response.json({ sent, failed })
})
