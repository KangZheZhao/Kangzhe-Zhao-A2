import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('dotenv').config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const base = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

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
assert.ok(events.every(event => /^[a-z-]+\.jpg$/.test(event.image_file)),
  'Every event needs a local image file.');

const first = events[0];
const detail = await get(`/api/events/${first.id}`);
assert.equal(detail.id, first.id);
assert.ok(detail.description && detail.purpose && detail.goal_amount);
assert.equal((await fetch(new URL(`/assets/${detail.image_file}`, base))).status, 200);

const selectedCategory = categories.find(category => category.name === first.category_name);
assert.ok(selectedCategory);
const byCategory = await get(`/api/events?categoryId=${selectedCategory.id}`);
assert.ok(byCategory.length > 0 && byCategory.every(event => event.category_name === first.category_name));

const byDate = await get(`/api/events?date=${first.event_date}`);
assert.ok(byDate.some(event => event.id === first.id));
assert.ok(byDate.every(event => event.event_date === first.event_date));

const location = encodeURIComponent(first.suburb);
const combined = await get(`/api/events?date=${first.event_date}&location=${location}&categoryId=${selectedCategory.id}`);
assert.ok(combined.some(event => event.id === first.id));

await get('/api/events?date=2026-02-30', 400);
await get('/api/events?categoryId=not-a-number', 400);
await get('/api/events/invalid', 400);
await get('/api/events/999999', 404);
await get('/api/events/10', 404);

console.log('API smoke test passed: categories, listings, filters, details and errors.');
