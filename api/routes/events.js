'use strict';
const express = require('express');
const pool = require('../event_db');
const { ApiError, requireId, positiveId, validDate, sydneyNow, eventStatus,
  validateEvent, validateRegistration, asyncRoute } = require('../lib/validation');
const router = express.Router();
const columns = `e.*, TIME_FORMAT(e.start_time, '%H:%i') AS start_time,
  TIME_FORMAT(e.end_time, '%H:%i') AS end_time,
  c.name AS category_name, o.name AS organisation_name,
  (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registration_count,
  COALESCE((SELECT SUM(r.tickets) FROM registrations r WHERE r.event_id = e.id), 0) AS tickets_booked`;
const joins = 'FROM events e JOIN categories c ON c.id = e.category_id JOIN organisations o ON o.id = e.organisation_id';
const eventFields = ['organisation_id', 'category_id', 'name', 'image_file', 'short_description',
  'purpose', 'description', 'event_date', 'start_time', 'end_time', 'venue', 'suburb', 'city',
  'ticket_price', 'goal_amount', 'raised_amount', 'ticket_capacity', 'latitude', 'longitude', 'is_suspended'];
function decorate(event) {
  event.is_suspended = Boolean(event.is_suspended);
  event.tickets_booked = Number(event.tickets_booked);
  event.available_tickets = Math.max(0, event.ticket_capacity - event.tickets_booked);
  event.status = eventStatus(event);
  return event;
}
async function eventDetail(id, admin = false, database = pool) {
  const [rows] = await database.execute(`SELECT ${columns} ${joins} WHERE e.id = ? ${admin ? '' : 'AND e.is_suspended = FALSE'}`, [id]);
  if (!rows.length) throw new ApiError(404, 'Event not found.');
  const event = decorate(rows[0]);
  // Contact details are only returned by the staff route, never the public detail API.
  const registrationColumns = admin ? '*' : 'id, full_name, registered_at, tickets';
  const [registrations] = await database.execute(`SELECT ${registrationColumns}
    FROM registrations WHERE event_id = ? ORDER BY registered_at DESC, id DESC`, [id]);
  event.registrations = registrations;
  return event;
}
router.get('/events', asyncRoute(async (request, response) => {
  const { date, location, categoryId } = request.query;
  if (date !== undefined && !validDate(date)) throw new ApiError(400, 'Enter a valid date in YYYY-MM-DD format.');
  if (location !== undefined && (typeof location !== 'string' || location.trim().length > 100)) throw new ApiError(400, 'Location must be text of up to 100 characters.');
  const category = categoryId === undefined ? null : positiveId(categoryId);
  if (categoryId !== undefined && !category) throw new ApiError(400, 'Choose a valid category.');
  const conditions = ['e.is_suspended = FALSE', 'TIMESTAMP(e.event_date, e.end_time) >= ?'];
  const parameters = [sydneyNow()];
  if (date) { conditions.push('e.event_date = ?'); parameters.push(date); }
  if (location && location.trim()) {
    conditions.push("CONCAT_WS(' ', e.venue, e.suburb, e.city) LIKE ? ESCAPE '!'");
    parameters.push(`%${location.trim().replace(/[!%_]/g, value => `!${value}`)}%`);
  }
  if (category) { conditions.push('e.category_id = ?'); parameters.push(category); }
  const [rows] = await pool.execute(`SELECT ${columns} ${joins} WHERE ${conditions.join(' AND ')} ORDER BY e.event_date, e.start_time, e.id`, parameters);
  response.json(rows.map(decorate));
}));
router.get('/events/:id', asyncRoute(async (request, response) => response.json(await eventDetail(requireId(request.params.id)))));
router.post('/events/:id/registrations', asyncRoute(async (request, response) => {
  const id = requireId(request.params.id);
  const registration = validateRegistration(request.body);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Lock the parent event: bookings, capacity changes and deletion cannot race.
    const [rows] = await connection.execute('SELECT * FROM events WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length || rows[0].is_suspended) throw new ApiError(404, 'Event not found.');
    const event = rows[0];
    if (eventStatus(event) !== 'Active') throw new ApiError(409, 'This event has finished. Choose an upcoming event.');
    const [existing] = await connection.execute('SELECT id FROM registrations WHERE event_id = ? AND email = ?', [id, registration.email]);
    if (existing.length) throw new ApiError(409, 'This email address is already registered for this event.');
    const [totals] = await connection.execute('SELECT COALESCE(SUM(tickets), 0) AS booked FROM registrations WHERE event_id = ?', [id]);
    const remaining = event.ticket_capacity - Number(totals[0].booked);
    if (registration.tickets > remaining) throw new ApiError(409, remaining > 0 ?
      `Only ${remaining} ticket${remaining === 1 ? '' : 's'} remain. Reduce the quantity and try again.` : 'This event is fully booked.');
    // Prices come from the database in integer cents, never from a browser.
    const total = Math.round(Number(event.ticket_price) * 100) * registration.tickets / 100;
    const [result] = await connection.execute(`INSERT INTO registrations
      (event_id, full_name, email, phone, registered_at, tickets, unit_price, total_amount)
      VALUES (?, ?, ?, ?, UTC_TIMESTAMP(6), ?, ?, ?)`,
    [id, registration.full_name, registration.email, registration.phone, registration.tickets, event.ticket_price, total]);
    const [saved] = await connection.execute('SELECT * FROM registrations WHERE id = ?', [result.insertId]);
    await connection.commit();
    response.location(`${request.app.locals.basePath}/api/events/${id}`).status(201).json({ registration: saved[0], event_name: event.name, message: 'Your registration is confirmed.' });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'This email address is already registered for this event.');
    throw error;
  } finally { connection.release(); }
}));
router.get('/admin/events', asyncRoute(async (_request, response) => {
  const [rows] = await pool.execute(`SELECT ${columns} ${joins} ORDER BY e.event_date DESC, e.start_time, e.id`);
  response.json(rows.map(decorate));
}));
router.get('/admin/events/:id', asyncRoute(async (request, response) => response.json(await eventDetail(requireId(request.params.id), true))));
router.post('/admin/events', asyncRoute(async (request, response) => {
  const event = validateEvent(request.body);
  const [result] = await pool.execute(`INSERT INTO events (${eventFields.join(', ')}) VALUES (${eventFields.map(() => '?').join(', ')})`, eventFields.map(key => event[key]));
  response.location(`${request.app.locals.basePath}/api/admin/events/${result.insertId}`).status(201).json(await eventDetail(result.insertId, true));
}));
router.put('/admin/events/:id', asyncRoute(async (request, response) => {
  const id = requireId(request.params.id);
  const event = validateEvent(request.body);
  const version = requireId(request.body.version);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT version FROM events WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw new ApiError(404, 'Event not found.');
    if (rows[0].version !== version) throw new ApiError(409, 'Another staff member changed this event. Reload it before saving.');
    const [totals] = await connection.execute('SELECT COALESCE(SUM(tickets), 0) AS booked FROM registrations WHERE event_id = ?', [id]);
    if (event.ticket_capacity < Number(totals[0].booked)) throw new ApiError(409, 'Capacity cannot be lower than the number of tickets already booked.');
    await connection.execute(`UPDATE events SET ${eventFields.map(key => `${key} = ?`).join(', ')}, version = version + 1 WHERE id = ?`, [...eventFields.map(key => event[key]), id]);
    const result = await eventDetail(id, true, connection);
    await connection.commit();
    response.json(result);
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}));
router.delete('/admin/events/:id', asyncRoute(async (request, response) => {
  const id = requireId(request.params.id);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT id FROM events WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw new ApiError(404, 'Event not found.');
    const [registrations] = await connection.execute('SELECT id FROM registrations WHERE event_id = ? LIMIT 1', [id]);
    if (registrations.length) throw new ApiError(409, 'This event has registrations and cannot be deleted. Suspend it to remove it from the public calendar.');
    await connection.execute('DELETE FROM events WHERE id = ?', [id]);
    await connection.commit();
    response.status(204).end();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}));
module.exports = router;
