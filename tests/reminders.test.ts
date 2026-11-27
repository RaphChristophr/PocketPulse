import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

test('reminder worker uses a single tag and opens the transaction form', async () => {
  const handlers = new Map<string, (event: unknown) => void>()
  const notices: Array<{ title: string; body: string; tag: string }> = []
  let opened = ''
  const self = {
    addEventListener: (name: string, listener: (event: unknown) => void) => handlers.set(name, listener),
    location: { origin: 'https://example.com' },
    registration: { showNotification: async (title: string, { body, tag }: { body: string; tag: string }) => { notices.push({ title, body, tag }) } },
    clients: { matchAll: async () => [], openWindow: async (url: string) => { opened = url } },
  }
  vm.runInNewContext(readFileSync(new URL('../public/push-reminders.js', import.meta.url), 'utf8'), { self, URL })
  let pending: Promise<unknown> | undefined
  const waitUntil = (work: Promise<unknown>) => { pending = work }
  handlers.get('push')!({ data: { json: () => ({ type: 'unknown' }) }, waitUntil })
  assert.equal(notices.length, 0)
  handlers.get('push')!({ data: { json: () => ({ type: 'pocketpulse-nightly', language: 'en' }) }, waitUntil })
  await pending
  assert.deepEqual(notices, [{ title: 'PocketPulse', body: 'Have you logged today’s transactions?', tag: 'pocketpulse-nightly' }])
  handlers.get('notificationclick')!({ notification: { tag: 'pocketpulse-nightly', close() {} }, waitUntil })
  await pending
  assert.equal(opened, 'https://example.com/#catat')
})
