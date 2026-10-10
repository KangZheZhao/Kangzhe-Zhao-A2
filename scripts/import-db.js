'use strict';
const fs = require('node:fs');
const path = require('node:path');
const api = path.join(__dirname, '../api');
require(path.join(api, 'node_modules/dotenv')).config({ path: path.join(api, '.env') });
const mysql = require(path.join(api, 'node_modules/mysql2/promise'));
(async function () {
  const connection = await mysql.createConnection({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, multipleStatements: true });
  try {
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length && !process.argv.includes('--replace-existing')) throw new Error('Database already has tables. Back it up before explicitly using --replace-existing.');
    await connection.query(fs.readFileSync(path.join(api, 'charityevents_db.sql'), 'utf8'));
    const [[counts]] = await connection.query('SELECT (SELECT COUNT(*) FROM events) AS events, (SELECT COUNT(*) FROM registrations) AS registrations');
    console.log(`Imported ${counts.events} events and ${counts.registrations} registrations into ${process.env.DB_NAME}.`);
  } finally { await connection.end(); }
}()).catch(error => { console.error(error.message); process.exitCode = 1; });
