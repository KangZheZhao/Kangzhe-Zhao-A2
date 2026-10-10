'use strict';
const fs = require('node:fs');
const path = require('node:path');
const api = path.join(__dirname, '../api');
require(path.join(api, 'node_modules/dotenv')).config({ path: path.join(api, '.env') });
const mysql = require(path.join(api, 'node_modules/mysql2/promise'));
(async function () {
  const connection = await mysql.createConnection({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, dateStrings: true, timezone: 'Z' });
  const tables = ['organisations', 'categories', 'events', 'registrations'];
  try {
    await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
    const lines = ['-- Sydney Community Giving schema and data export', '-- Select an empty project database before importing.',
      '-- Registration timestamps use UTC; event dates and times use Sydney local time.', 'SET NAMES utf8mb4;', ''];
    for (const table of tables) {
      const [definition] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
      lines.push(definition[0]['Create Table'] + ';');
      const [rows] = await connection.query(`SELECT * FROM \`${table}\` ORDER BY id`);
      if (rows.length) {
        const keys = Object.keys(rows[0]);
        lines.push(`INSERT INTO \`${table}\` (${keys.map(key => `\`${key}\``).join(', ')}) VALUES`);
        lines.push(rows.map(row => '(' + keys.map(key => connection.escape(row[key])).join(', ') + ')').join(',\n') + ';');
      }
      lines.push('');
    }
    await connection.commit();
    const output = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '../database/charityevents_db.sql');
    fs.mkdirSync(path.dirname(output), { recursive: true }); fs.writeFileSync(output, lines.join('\n').trimEnd() + '\n');
    console.log(`Exported four tables to ${output}`);
  } finally { await connection.end(); }
}()).catch(error => { console.error(error.message); process.exitCode = 1; });
