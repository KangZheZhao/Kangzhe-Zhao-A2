'use strict';

class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
function positiveId(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const text = String(value ?? '');
  if (!/^[1-9]\d*$/.test(text)) return null;
  const id = Number(text);
  return Number.isSafeInteger(id) && id <= 4294967295 ? id : null;
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1000 && date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function sydneyNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}
function eventStatus(event, now = sydneyNow()) {
  if (event.is_suspended) return 'Suspended';
  return `${event.event_date} ${event.end_time}:00`.slice(0, 19) < now ? 'Past' : 'Active';
}
function textField(body, key, max, fields) {
  const value = typeof body[key] === 'string' ? body[key].trim() : '';
  if (!value || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    fields[key] = `Enter ${key.replaceAll('_', ' ')} (up to ${max} characters).`;
  }
  return value;
}
function moneyField(body, key, positive, fields) {
  const value = body[key];
  if ((typeof value !== 'number' && typeof value !== 'string') ||
      !/^\d{1,8}(\.\d{1,2})?$/.test(String(value)) ||
      !Number.isFinite(Number(value)) || (positive && Number(value) <= 0)) {
    fields[key] = positive ? 'Enter an amount greater than zero, with up to two decimal places.' :
      'Enter a non-negative amount, with up to two decimal places.';
  }
  return Number(value);
}
const images = ['community-run.jpg', 'market.jpg', 'dinner.jpg', 'concert.jpg', 'art-gallery.jpg', 'sydney-harbour.jpg'];
function validateEvent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Enter the event details.');
  const fields = {};
  const data = {};
  for (const [key, max] of Object.entries({ name: 160, short_description: 255, purpose: 255,
    description: 8000, venue: 140, suburb: 100, city: 100 })) data[key] = textField(body, key, max, fields);
  for (const key of ['organisation_id', 'category_id']) {
    data[key] = positiveId(body[key]);
    if (!data[key]) fields[key] = 'Choose a valid option.';
  }
  data.event_date = body.event_date;
  if (!validDate(data.event_date)) fields.event_date = 'Enter a valid date.';
  for (const key of ['start_time', 'end_time']) {
    data[key] = body[key];
    if (typeof data[key] !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data[key])) fields[key] = 'Enter a valid time.';
  }
  if (!fields.start_time && !fields.end_time && data.end_time <= data.start_time) fields.end_time = 'End time must be after start time.';
  data.image_file = body.image_file;
  if (!images.includes(data.image_file)) fields.image_file = 'Choose one of the supplied event photos.';
  data.ticket_price = moneyField(body, 'ticket_price', false, fields);
  data.goal_amount = moneyField(body, 'goal_amount', true, fields);
  data.raised_amount = moneyField(body, 'raised_amount', false, fields);
  data.ticket_capacity = Number(body.ticket_capacity);
  if (!positiveId(body.ticket_capacity) || data.ticket_capacity > 100000) fields.ticket_capacity = 'Capacity must be a whole number from 1 to 100,000.';
  for (const [key, limit] of [['latitude', 90], ['longitude', 180]]) {
    data[key] = Number(body[key]);
    if (body[key] === null || body[key] === undefined || (typeof body[key] === 'string' && !body[key].trim()) ||
        !['number', 'string'].includes(typeof body[key]) || !Number.isFinite(data[key]) || Math.abs(data[key]) > limit) {
      fields[key] = `Enter a coordinate between -${limit} and ${limit}.`;
    }
  }
  if (typeof body.is_suspended !== 'boolean') fields.is_suspended = 'Suspension must be true or false.';
  data.is_suspended = body.is_suspended;
  if (Object.keys(fields).length) throw new ApiError(400, 'Check the highlighted event fields.', fields);
  return data;
}
function validateRegistration(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Enter your registration details.');
  const fields = {};
  const data = {
    full_name: textField(body, 'full_name', 120, fields),
    email: textField(body, 'email', 160, fields).toLowerCase(),
    phone: textField(body, 'phone', 32, fields), tickets: Number(body.tickets)
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) fields.email = 'Enter a valid email address.';
  if (!/^[+\d() .-]+$/.test(data.phone) || data.phone.replace(/\D/g, '').length < 7 ||
      data.phone.replace(/\D/g, '').length > 15) fields.phone = 'Enter a phone number with 7 to 15 digits.';
  if (!positiveId(body.tickets) || data.tickets > 10) fields.tickets = 'Choose a whole number of tickets from 1 to 10.';
  if (body.accept_terms !== true) fields.accept_terms = 'Please confirm that your details are correct.';
  if (Object.keys(fields).length) throw new ApiError(400, 'Check your registration details.', fields);
  return data;
}
function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}
function requireId(value) {
  const id = positiveId(value);
  if (id === null) throw new ApiError(400, 'ID must be a positive whole number.');
  return id;
}
module.exports = { ApiError, positiveId, requireId, validDate, sydneyNow, eventStatus,
  validateEvent, validateRegistration, images, textField, asyncRoute };
