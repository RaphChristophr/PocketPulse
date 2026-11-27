const reminderTag = 'pocketpulse-nightly'

self.addEventListener('push', event => {
  if (!event.data) return
  let payload
  try { payload = event.data.json() } catch { return }
  if (payload.type !== reminderTag) return
  const english = payload.language === 'en'
  event.waitUntil(self.registration.showNotification('PocketPulse', {
    body: english ? 'Have you logged today’s transactions?' : 'Sudah catat transaksi hari ini?',
    icon: '/icon-192.png',
    tag: reminderTag,
  }))
})

self.addEventListener('notificationclick', event => {
  if (event.notification.tag !== reminderTag) return
  event.notification.close()
  const url = new URL('/#catat', self.location.origin).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const client = windows.find(item => new URL(item.url).origin === self.location.origin)
    if (client?.navigate) {
      const opened = await client.navigate(url)
      if (opened) return opened.focus()
    }
    return self.clients.openWindow(url)
  })())
})
