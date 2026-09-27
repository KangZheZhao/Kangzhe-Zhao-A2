require('dotenv').config();

const express = require('express');
const path = require('path');
const pool = require('./event_db');

const app = express();
const clientDirectory = path.resolve(__dirname, '../clientside');
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');

function sendError(response, status, message) {
  response.status(status).json({ error: message });
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1000) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
}

function positiveId(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= 4294967295 ? parsed : null;
}

function sydneyNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Australia/Sydney',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

function escapeLike(value) {
  return value.replace(/[!%_]/g, character => `!${character}`);
}

const summaryColumns = `
  e.id, e.name, e.short_description, e.event_date,
  TIME_FORMAT(e.start_time, '%H:%i') AS start_time,
  TIME_FORMAT(e.end_time, '%H:%i') AS end_time,
  e.venue, e.suburb, e.city, e.ticket_price,
  c.name AS category_name,
  o.name AS organisation_name`;

app.get('/api/events', async (request, response) => {
  const { date, location, categoryId } = request.query;
  if (date !== undefined && !validDate(date)) {
    return sendError(response, 400, 'Date must be a valid YYYY-MM-DD value.');
  }
  if (location !== undefined &&
      (typeof location !== 'string' || location.trim().length > 100)) {
    return sendError(response, 400, 'Location must be text of at most 100 characters.');
  }
  const category = categoryId === undefined ? null : positiveId(categoryId);
  if (categoryId !== undefined && category === null) {
    return sendError(response, 400, 'Category ID must be a positive integer.');
  }

  const conditions = [
    'e.is_suspended = FALSE',
    'TIMESTAMP(e.event_date, e.end_time) >= ?'
  ];
  const parameters = [sydneyNow()];
  if (date !== undefined) {
    conditions.push('e.event_date = ?');
    parameters.push(date);
  }
  if (location && location.trim()) {
    conditions.push("CONCAT_WS(' ', e.venue, e.suburb, e.city) LIKE ? ESCAPE '!'");
    parameters.push(`%${escapeLike(location.trim())}%`);
  }
  if (category !== null) {
    conditions.push('e.category_id = ?');
    parameters.push(category);
  }

  try {
    const [rows] = await pool.execute(`
      SELECT ${summaryColumns}
      FROM events e
      JOIN categories c ON c.id = e.category_id
      JOIN organisations o ON o.id = e.organisation_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.event_date, e.start_time, e.id
    `, parameters);
    response.json(rows);
  } catch (error) {
    console.error('Unable to list events:', error);
    sendError(response, 500, 'Unable to load events right now.');
  }
});

app.get('/api/categories', async (_request, response) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name FROM categories ORDER BY name'
    );
    response.json(rows);
  } catch (error) {
    console.error('Unable to list categories:', error);
    sendError(response, 500, 'Unable to load categories right now.');
  }
});

app.get('/api/events/:id', async (request, response) => {
  const id = positiveId(request.params.id);
  if (id === null) {
    return sendError(response, 400, 'Event ID must be a positive integer.');
  }

  try {
    const [rows] = await pool.execute(`
      SELECT ${summaryColumns}, e.purpose, e.description,
        e.goal_amount, e.raised_amount, e.organisation_id,
        o.mission AS organisation_mission, o.contact_email
      FROM events e
      JOIN categories c ON c.id = e.category_id
      JOIN organisations o ON o.id = e.organisation_id
      WHERE e.id = ? AND e.is_suspended = FALSE
    `, [id]);
    if (rows.length === 0) {
      return sendError(response, 404, 'Event not found.');
    }
    response.json(rows[0]);
  } catch (error) {
    console.error('Unable to load event:', error);
    sendError(response, 500, 'Unable to load this event right now.');
  }
});

app.use('/api', (_request, response) => {
  sendError(response, 404, 'API endpoint not found.');
});

app.use(express.static(clientDirectory));

async function start() {
  if (!process.env.DB_USER) {
    throw new Error('DB_USER is missing. Copy .env.example to .env and set local MySQL credentials.');
  }
  await pool.query('SELECT 1');
  app.listen(port, () => {
    console.log(`Charity events website running at http://localhost:${port}`);
  });
}

if (require.main === module) {
  start().catch(error => {
    console.error('Unable to start the website:', error.message);
    process.exitCode = 1;
    pool.end();
  });
}

module.exports = { app, validDate, positiveId, sydneyNow };
