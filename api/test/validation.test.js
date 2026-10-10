'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validDate, positiveId, validateRegistration, validateEvent, eventStatus, ApiError } = require('../lib/validation');
test('calendar dates reject impossible days and allow leap years', () => {
  for (const value of ['2026-02-30', '2025-02-29', '2026-13-01', '', ['2026-01-01']]) assert.equal(validDate(value), false);
  assert.equal(validDate('2024-02-29'), true);
});
test('identifiers reject coercible objects, fractions and oversized IDs', () => {
  for (const value of [[1], true, {}, '01', 0, -1, 1.5, '1 OR 1=1', '4294967296']) assert.equal(positiveId(value), null);
  assert.equal(positiveId(1), 1); assert.equal(positiveId('4294967295'), 4294967295);
});
const registration = { full_name: 'Alex Chen', email: 'ALEX@example.com', phone: '+61 400 123 456', tickets: 2, accept_terms: true };
test('registration normalises identity and rejects invalid quantities and contact details', () => {
  assert.equal(validateRegistration(registration).email, 'alex@example.com');
  for (const change of [{ tickets: 0 }, { tickets: 11 }, { tickets: 1.2 }, { tickets: [1] }, { email: 'wrong' },
    { phone: '123' }, { phone: 'phone-number' }, { full_name: '   ' }, { accept_terms: false }]) {
    assert.throws(() => validateRegistration({ ...registration, ...change }), ApiError);
  }
});
const event = { name: 'Harbour day', category_id: 1, organisation_id: 1, image_file: 'market.jpg', short_description: 'Local market',
  purpose: 'Food relief', description: 'Market stalls by the harbour.', event_date: '2026-10-20', start_time: '09:00', end_time: '12:00',
  venue: 'Barangaroo Reserve', suburb: 'Barangaroo', city: 'Sydney', ticket_price: 2.50, goal_amount: 1000, raised_amount: 0,
  ticket_capacity: 20, latitude: -33.85, longitude: 151.2, is_suspended: false };
test('event validation rejects bad schedules, money, capacity, coordinates and image paths', () => {
  assert.equal(validateEvent(event).ticket_price, 2.5);
  for (const change of [{ end_time: '08:00' }, { ticket_price: -1 }, { ticket_price: 0.001 }, { ticket_price: true },
    { goal_amount: 0 }, { ticket_capacity: 1.5 }, { latitude: ' ' }, { latitude: 91 }, { longitude: 181 },
    { image_file: '../../.env' }, { category_id: [1] }, { is_suspended: 'false' }]) {
    assert.throws(() => validateEvent({ ...event, ...change }), ApiError);
  }
});
test('Sydney event status handles both API and raw SQL time formats', () => {
  assert.equal(eventStatus({ event_date: '2026-10-10', end_time: '12:00', is_suspended: false }, '2026-10-10 11:59:59'), 'Active');
  assert.equal(eventStatus({ event_date: '2026-10-10', end_time: '12:00:00', is_suspended: false }, '2026-10-10 12:00:01'), 'Past');
  assert.equal(eventStatus({ ...event, is_suspended: true }), 'Suspended');
});
