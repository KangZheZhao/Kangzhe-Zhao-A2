import assert from 'node:assert/strict';

const base = process.env.BASE_URL || 'http://localhost:3000';

async function get(path, expectedStatus = 200) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, expectedStatus, `${path} returned ${response.status}`);
  return response.json();
}

const categories = await get('/api/categories');
assert.ok(categories.length >= 3, 'At least three categories are expected.');

const events = await get('/api/events');
assert.ok(events.length >= 8, 'At least eight active upcoming events are expected.');
assert.ok(events.every(event => event.id !== 9 && event.id !== 10),
  'Past and suspended sample events must be hidden from listings.');

const first = events[0];
const detail = await get(`/api/events/${first.id}`);
assert.equal(detail.id, first.id);
assert.ok(detail.description && detail.purpose && detail.goal_amount);

const byCategory = await get(`/api/events?categoryId=${first.category_id || categories.find(category => category.name === first.category_name).id}`);
assert.ok(byCategory.length > 0 && byCategory.every(event => event.category_name === first.category_name));

const byDate = await get(`/api/events?date=${first.event_date}`);
assert.ok(byDate.some(event => event.id === first.id));
assert.ok(byDate.every(event => event.event_date === first.event_date));

const location = encodeURIComponent(first.suburb);
const combined = await get(`/api/events?date=${first.event_date}&location=${location}&categoryId=${categories.find(category => category.name === first.category_name).id}`);
assert.ok(combined.some(event => event.id === first.id));

await get('/api/events?date=2026-02-30', 400);
await get('/api/events?categoryId=not-a-number', 400);
await get('/api/events/invalid', 400);
await get('/api/events/999999', 404);
await get('/api/events/10', 404);

console.log('API smoke test passed: categories, listings, filters, details and errors.');
