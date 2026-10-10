'use strict';
const express = require('express');
const pool = require('../event_db');
const { ApiError, requireId, sydneyNow, asyncRoute } = require('../lib/validation');
const router = express.Router();
const cache = new Map();
const descriptions = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Freezing fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  56: 'Freezing drizzle', 57: 'Heavy freezing drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Heavy freezing rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  77: 'Snow grains', 80: 'Light showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers',
  86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail' };
router.get('/events/:id/weather', asyncRoute(async (request, response) => {
  const id = requireId(request.params.id);
  const [rows] = await pool.execute('SELECT latitude, longitude, event_date FROM events WHERE id = ? AND is_suspended = FALSE', [id]);
  if (!rows.length) throw new ApiError(404, 'Event not found.');
  const event = rows[0];
  if (event.latitude === null || event.longitude === null) return response.json({ available: false, reason: 'The venue coordinates have not been set.' });
  const today = sydneyNow().slice(0, 10);
  const difference = (Date.parse(event.event_date) - Date.parse(today)) / 86400000;
  // Forecasts cover today plus 15 days. Never label today's weather as the event forecast.
  if (difference < 0 || difference > 15) return response.json({ available: false, reason: difference < 0 ?
    'This event has finished.' : 'The forecast will be available within 16 days of the event.' });
  const key = `${event.latitude},${event.longitude},${event.event_date}`;
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return response.json(saved.data);
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({ latitude: event.latitude, longitude: event.longitude,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'Australia/Sydney', start_date: event.event_date, end_date: event.event_date }).toString();
  let source;
  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`Weather service returned ${upstream.status}`);
    source = await upstream.json();
    if (source.daily?.time?.[0] !== event.event_date) throw new Error('The forecast date was not returned.');
  } catch (error) {
    console.error('Weather unavailable:', error.message);
    return response.status(503).json({ error: 'The forecast is unavailable right now. Check again later.' });
  }
  const daily = source.daily;
  const code = daily.weather_code?.[0];
  const low = daily.temperature_2m_min?.[0];
  const high = daily.temperature_2m_max?.[0];
  if (!Number.isFinite(code) || !Number.isFinite(low) || !Number.isFinite(high)) return response.json({ available: false, reason: 'The weather service has no complete forecast for this date yet.' });
  const data = { available: true, date: event.event_date, description: descriptions[code] || 'Conditions unavailable',
    latitude: event.latitude, longitude: event.longitude,
    code, low, high, rain_chance: daily.precipitation_probability_max?.[0] ?? null,
    source: 'Open-Meteo', source_url: 'https://open-meteo.com/', fetched_at: new Date().toISOString() };
  if (cache.size >= 200) cache.delete(cache.keys().next().value);
  cache.set(key, { data, expires: Date.now() + 15 * 60000 });
  response.json(data);
}));
module.exports = router;
