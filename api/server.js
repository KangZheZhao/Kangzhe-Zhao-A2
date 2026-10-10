'use strict';
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const pool = require('./event_db');
const { ApiError, validDate, positiveId, sydneyNow, asyncRoute } = require('./lib/validation');
const app = express();
app.disable('x-powered-by');
app.set('query parser', 'simple');
app.use((request, response, next) => {
  response.set('X-Content-Type-Options', 'nosniff');
  response.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (request.path.startsWith('/api/')) response.set('Cache-Control', 'no-store');
  // All three sites share one origin. The brief deliberately omits staff authentication.
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const origin = request.get('Origin');
    if (origin) {
      let originHost;
      try { originHost = new URL(origin).host; } catch (_) { return next(new ApiError(403, 'Unrecognised request origin.')); }
      if (originHost !== request.get('Host')) return next(new ApiError(403, 'Use the website to make changes.'));
    }
    if (['POST', 'PUT'].includes(request.method) && !request.is('application/json')) return next(new ApiError(415, 'Send event data as JSON.'));
  }
  next();
});
app.use(express.json({ limit: '32kb', strict: true }));
app.get('/api/health', asyncRoute(async (_request, response) => {
  await pool.query('SELECT 1');
  response.json({ status: 'ok', version: '2.0.0' });
}));
app.use('/api', require('./routes/events'));
app.use('/api', require('./routes/categories'));
app.use('/api', require('./routes/weather'));
app.use('/api', (_request, _response, next) => next(new ApiError(404, 'API endpoint not found.')));
app.use('/admin', express.static(path.join(__dirname, '../adminside')));
app.use(express.static(path.join(__dirname, '../clientside')));
app.use((_request, response) => response.status(404).send('Page not found. Return to the event calendar at /.'));
app.use((error, _request, response, _next) => {
  let status = error.status || 500;
  let message = error.message;
  if (error.type === 'entity.parse.failed') { status = 400; message = 'The request contains invalid JSON.'; }
  if (error.type === 'entity.too.large') { status = 413; message = 'The submitted data is too large.'; }
  if (error.code === 'ER_DUP_ENTRY') { status = 409; message = 'A record with those details already exists.'; }
  if (error.code === 'ER_ROW_IS_REFERENCED_2') { status = 409; message = 'This record is in use and cannot be deleted.'; }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') { status = 400; message = 'The selected category, organiser or event no longer exists.'; }
  if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') {
    status = 409; message = 'Another request changed this record. Reload and try again.';
  }
  if (status >= 500) {
    console.error('Request failed:', error.code || error.message);
    message = 'The service could not complete your request. Please try again.';
  }
  response.status(status).json({ error: message, ...(error.fields ? { fields: error.fields } : {}) });
});
async function start() {
  if (!process.env.DB_USER || !process.env.DB_NAME) throw new Error('Set DB_USER, DB_NAME and the database settings in api/.env.');
  await pool.query('SELECT 1');
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, process.env.HOST || '127.0.0.1', () => {
    console.log(`Sydney Community Giving: http://localhost:${port}`);
  });
  let closing = false;
  async function close() {
    if (closing) return;
    closing = true;
    server.close(async () => { await pool.end(); process.exit(0); });
    setTimeout(() => process.exit(0), 5000).unref();
  }
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
  return server;
}
if (require.main === module) start().catch(async error => {
  console.error('Unable to start:', error.message);
  await pool.end();
  process.exitCode = 1;
});
module.exports = { app, start, validDate, positiveId, sydneyNow };
