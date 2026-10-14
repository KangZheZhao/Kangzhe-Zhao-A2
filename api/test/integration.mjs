import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const api = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
require('dotenv').config({ path: path.join(api, '.env') });
const pool = require('../event_db');
const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname) || !process.env.DB_NAME?.endsWith('_dev') ||
    !['localhost', '127.0.0.1'].includes(process.env.DB_HOST || '127.0.0.1')) {
  throw new Error('Write tests require a loopback server and a dedicated database ending in _dev.');
}
const results = [];
const eventIds = [];
const categoryIds = [];
async function request(method, url, body, expected = 200, extraHeaders = {}) {
  const response = await fetch(new URL(url, base), { method, headers: { 'Content-Type': 'application/json', ...extraHeaders },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, `${method} ${url}: ${response.status} ${JSON.stringify(data)}`);
  return data;
}
async function check(name, action) { await action(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
const stamp = Date.now();
const date = new Date(); date.setUTCDate(date.getUTCDate() + 3);
const eventData = { organisation_id: 1, category_id: 1, name: `Integration event ${stamp}`, image_file: 'community-run.jpg',
  short_description: 'Temporary integration test event.', purpose: 'Food relief.', description: 'Disposable local test fixture.',
  event_date: date.toISOString().slice(0, 10), start_time: '09:00', end_time: '12:00', venue: 'Barangaroo Reserve', suburb: 'Barangaroo',
  city: 'Sydney', ticket_price: 12.5, goal_amount: 1000, raised_amount: 0, ticket_capacity: 5,
  latitude: -33.8573, longitude: 151.2011, is_suspended: false };
const registration = { full_name: 'Integration Participant', email: `integration-${stamp}@example.com`, phone: '+61 400 123 456', tickets: 2, accept_terms: true };
let event;
try {
  await check('public calendar excludes past and suspended events; admin includes both', async () => {
    const events = await request('GET', '/api/events');
    const admin = await request('GET', '/api/admin/events');
    assert.ok(events.length >= 8); assert.ok(events.every(row => row.status === 'Active'));
    assert.ok(admin.some(row => row.status === 'Past')); assert.ok(admin.some(row => row.status === 'Suspended'));
  });
  await check('registrations are newest first; public API excludes contact details', async () => {
    const detail = await request('GET', '/api/events/1');
    assert.ok(detail.registrations.length >= 4);
    assert.ok(detail.registrations.every(row => !('email' in row) && !('phone' in row)));
    assert.deepEqual(detail.registrations.map(row => row.id), [...detail.registrations].sort((a, b) => b.registered_at.localeCompare(a.registered_at) || b.id - a.id).map(row => row.id));
    const staff = await request('GET', '/api/admin/events/1');
    assert.ok(staff.registrations.every(row => row.email && row.phone));
  });
  await check('combined filters, empty results and invalid dates behave correctly', async () => {
    const first = (await request('GET', '/api/events'))[0];
    const rows = await request('GET', `/api/events?date=${first.event_date}&location=${encodeURIComponent(first.suburb)}&categoryId=${first.category_id}`);
    assert.ok(rows.some(row => row.id === first.id));
    assert.equal((await request('GET', '/api/events?location=nowhere-unique')).length, 0);
    assert.equal((await request('GET', '/api/events?location=%25')).length, 0);
    await request('GET', '/api/events?date=2026-02-30', undefined, 400);
    await request('GET', '/api/events?categoryId=1.1', undefined, 400);
  });
  await check('malformed JSON, wrong content type and cross-origin writes are rejected', async () => {
    assert.equal((await fetch(new URL('/api/admin/events', base), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await fetch(new URL('/api/admin/events', base), { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' })).status, 415);
    await request('POST', '/api/admin/events', eventData, 403, { Origin: 'https://other.example.com' });
  });
  await check('categories support create and duplicate protection', async () => {
    const category = await request('POST', '/api/admin/categories', { name: `Integration category ${stamp}` }, 201);
    categoryIds.push(category.id); eventData.category_id = category.id;
    await request('POST', '/api/admin/categories', { name: category.name }, 409);
    await request('POST', '/api/admin/categories', { name: ' ' }, 400);
  });
  await check('event create validates fields and foreign keys', async () => {
    await request('POST', '/api/admin/events', { ...eventData, end_time: '08:00' }, 400);
    await request('POST', '/api/admin/events', { ...eventData, category_id: 4294967295 }, 400);
    event = await request('POST', '/api/admin/events', eventData, 201); eventIds.push(event.id);
    assert.equal(event.status, 'Active'); assert.equal(event.available_tickets, 5);
    assert.ok((await request('GET', '/api/events')).some(row => row.id === event.id));
  });
  await check('event update increments version and blocks stale edits', async () => {
    const stale = event.version;
    event = await request('PUT', `/api/admin/events/${event.id}`, { ...eventData, name: 'Updated integration event', version: stale });
    assert.equal(event.version, stale + 1);
    await request('PUT', `/api/admin/events/${event.id}`, { ...eventData, version: stale }, 409);
  });
  await check('registration validation and server-controlled prices', async () => {
    await request('POST', `/api/events/${event.id}/registrations`, { ...registration, tickets: 0 }, 400);
    await request('POST', `/api/events/${event.id}/registrations`, { ...registration, phone: '12' }, 400);
    await request('POST', `/api/events/${event.id}/registrations`, { ...registration, accept_terms: false }, 400);
    const saved = await request('POST', `/api/events/${event.id}/registrations`, { ...registration, unit_price: 0, total_amount: 0, registered_at: '2000-01-01' }, 201);
    assert.equal(saved.registration.unit_price, 12.5); assert.equal(saved.registration.total_amount, 25);
    assert.ok(saved.registration.registered_at.startsWith(new Date().toISOString().slice(0, 10)));
  });
  await check('duplicate registration uses case-insensitive email identity', async () => {
    await request('POST', `/api/events/${event.id}/registrations`, registration, 409);
    await request('POST', `/api/events/${event.id}/registrations`, { ...registration, email: registration.email.toUpperCase() }, 409);
  });
  await check('simultaneous registrations from the same email create one row', async () => {
    const payload = { ...registration, email: `parallel-${stamp}@example.com`, tickets: 1 };
    const responses = await Promise.all([1, 2].map(() => fetch(new URL(`/api/events/${event.id}/registrations`, base), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })));
    assert.deepEqual(responses.map(row => row.status).sort(), [201, 409]);
  });
  await check('simultaneous bookings cannot oversell the remaining capacity', async () => {
    const responses = await Promise.all([1, 2].map(index => fetch(new URL(`/api/events/${event.id}/registrations`, base), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...registration, email: `capacity-${stamp}-${index}@example.com`, tickets: 2 }) })));
    assert.deepEqual(responses.map(row => row.status).sort(), [201, 409]);
    const detail = await request('GET', `/api/events/${event.id}`);
    assert.equal(detail.tickets_booked, 5); assert.equal(detail.available_tickets, 0);
    await request('POST', `/api/events/${event.id}/registrations`, { ...registration, email: `full-${stamp}@example.com`, tickets: 1 }, 409);
  });
  await check('capacity cannot shrink below bookings; price changes preserve old totals', async () => {
    await request('PUT', `/api/admin/events/${event.id}`, { ...eventData, version: event.version, ticket_capacity: 4 }, 409);
    event = await request('PUT', `/api/admin/events/${event.id}`, { ...eventData, version: event.version, ticket_capacity: 8, ticket_price: 15 });
    assert.equal(event.registrations[0].unit_price, 12.5);
    assert.equal(event.available_tickets, 3);
  });
  await check('a person can register for a second event', async () => {
    const second = await request('POST', '/api/admin/events', { ...eventData, name: 'Second integration event' }, 201); eventIds.push(second.id);
    await request('POST', `/api/events/${second.id}/registrations`, registration, 201);
  });
  await check('registered events cannot be deleted through API or SQL', async () => {
    await request('DELETE', `/api/admin/events/${event.id}`, undefined, 409);
    await assert.rejects(pool.execute('DELETE FROM events WHERE id = ?', [event.id]), { code: 'ER_ROW_IS_REFERENCED_2' });
  });
  await check('suspension hides the event and stops new registrations', async () => {
    event = await request('PUT', `/api/admin/events/${event.id}`, { ...eventData, version: event.version, is_suspended: true, ticket_capacity: 8 });
    await request('GET', `/api/events/${event.id}`, undefined, 404);
    await request('POST', `/api/events/${event.id}/registrations`, registration, 404);
    assert.equal((await request('GET', `/api/admin/events/${event.id}`)).status, 'Suspended');
  });
  await check('past events reject bookings and unregistered events can be deleted', async () => {
    const past = await request('POST', '/api/admin/events', { ...eventData, name: 'Past integration event', event_date: '2025-01-01' }, 201); eventIds.push(past.id);
    await request('POST', `/api/events/${past.id}/registrations`, registration, 409);
    await request('DELETE', `/api/admin/events/${past.id}`, undefined, 204);
    await request('GET', `/api/admin/events/${past.id}`, undefined, 404);
  });
  await check('used categories are protected; renaming updates related listings', async () => {
    const categoryId = categoryIds[0];
    await request('DELETE', `/api/admin/categories/${categoryId}`, undefined, 409);
    await request('PUT', `/api/admin/categories/${categoryId}`, { name: `Renamed category ${stamp}` });
    assert.equal((await request('GET', `/api/admin/events/${event.id}`)).category_name, `Renamed category ${stamp}`);
  });
  await check('weather handles unsupported dates, past dates and unknown events', async () => {
    assert.equal((await request('GET', '/api/events/3/weather')).available, false);
    assert.equal((await request('GET', '/api/events/9/weather')).available, false);
    await request('GET', '/api/events/4294967295/weather', undefined, 404);
  });
  await check('all frontend pages and local dependencies are served', async () => {
    for (const url of ['/', '/search.html', '/event.html?id=1', '/registration.html?id=1', '/about.html',
      '/admin/', '/admin/event.html', '/admin/categories.html', '/build-manifest.json', '/booking.css']) {
      assert.equal((await fetch(new URL(url, base))).status, 200, url);
    }
    assert.equal((await fetch(new URL('/api/.env', base))).status, 404);
  });
} finally {
  // Exact fixture IDs only; sample and user records are never part of this cleanup.
  for (const id of eventIds) {
    await pool.execute('DELETE FROM registrations WHERE event_id = ?', [id]);
    await pool.execute('DELETE FROM events WHERE id = ?', [id]);
  }
  for (const id of categoryIds) await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
  await pool.end();
}
fs.mkdirSync(path.resolve(api, '../.local'), { recursive: true });
fs.writeFileSync(path.resolve(api, '../.local/integration-results.json'), JSON.stringify({ at: new Date().toISOString(), cases: results }, null, 2));
console.log(`${results.length} integration checks passed. All temporary fixtures removed.`);
