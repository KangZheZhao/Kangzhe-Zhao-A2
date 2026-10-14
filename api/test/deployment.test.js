'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
process.env.APP_BASE_PATH = '/hosted-demo';
const { app } = require('../server');
const pool = require('../event_db');
let server, origin;
test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = 'http://127.0.0.1:' + server.address().port;
});
test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  });
  await pool.end();
});

test('hosted entry and staff redirects retain the application prefix and query', async () => {
  for (const [request, expected] of [['/hosted-demo', '/hosted-demo/'],
    ['/hosted-demo?view=events', '/hosted-demo/?view=events'],
    ['/hosted-demo/admin?view=all', '/hosted-demo/admin/?view=all'], ['/admin', '/hosted-demo/admin/']]) {
    const response = await fetch(origin + request, { redirect: 'manual' });
    assert.equal(response.status, 308, request);
    assert.equal(response.headers.get('location'), expected);
    await response.text();
  }
});

test('all hosted pages, navigation and bundled resources remain inside the application', async () => {
  const resources = new Set(['/hosted-demo/assets/BarlowCondensed-Bold.ttf']);
  for (const route of ['/', '/index.html', '/search.html', '/event.html', '/registration.html', '/about.html',
    '/admin/', '/admin/index.html', '/admin/event.html', '/admin/categories.html']) {
    const response = await fetch(origin + '/hosted-demo' + route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type'), /text\/html/);
    const html = await response.text();
    assert.match(html, /<base href="\/hosted-demo\/">/);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (match[1].includes('{{') || match[1].startsWith('#')) continue;
      const url = new URL(match[1], origin + '/hosted-demo/');
      if (url.origin !== origin) continue;
      assert.ok(url.pathname.startsWith('/hosted-demo/'), match[1]);
      resources.add(url.pathname + url.search);
    }
  }
  for (const resource of resources) {
    const response = await fetch(origin + resource);
    assert.equal(response.status, 200, resource);
    await response.arrayBuffer();
  }
  const forwardedWithoutPrefix = await fetch(origin + '/admin/event.html');
  assert.match(await forwardedWithoutPrefix.text(), /<base href="\/hosted-demo\/">/);
});

test('similar prefixes and private application files do not resolve to public content', async () => {
  for (const route of ['/hosted-demo-other/api/health', '/hosted-demo/api/.env',
    '/hosted-demo/api/server.js', '/hosted-demo/README.md']) {
    const response = await fetch(origin + route);
    assert.equal(response.status, 404, route);
    await response.text();
  }
});
