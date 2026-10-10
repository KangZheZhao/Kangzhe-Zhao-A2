'use strict';
const express = require('express');
const pool = require('../event_db');
const { ApiError, requireId, textField, asyncRoute } = require('../lib/validation');
const router = express.Router();
router.get('/categories', asyncRoute(async (_request, response) => {
  const [rows] = await pool.query(`SELECT c.id, c.name, COUNT(e.id) AS event_count FROM categories c
    LEFT JOIN events e ON e.category_id = c.id GROUP BY c.id, c.name ORDER BY c.name`);
  response.json(rows);
}));
router.get('/organisations', asyncRoute(async (_request, response) => {
  const [rows] = await pool.query('SELECT id, name, mission, contact_email FROM organisations ORDER BY name');
  response.json(rows);
}));
function categoryName(body) {
  const fields = {};
  const name = textField(body || {}, 'name', 80, fields);
  if (Object.keys(fields).length) throw new ApiError(400, 'Enter a category name of up to 80 characters.', fields);
  return name;
}
router.post('/admin/categories', asyncRoute(async (request, response) => {
  const name = categoryName(request.body);
  const [result] = await pool.execute('INSERT INTO categories (name) VALUES (?)', [name]);
  response.status(201).json({ id: result.insertId, name, event_count: 0 });
}));
router.put('/admin/categories/:id', asyncRoute(async (request, response) => {
  const id = requireId(request.params.id);
  const name = categoryName(request.body);
  const [result] = await pool.execute('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
  if (!result.affectedRows) throw new ApiError(404, 'Category not found.');
  response.json({ id, name });
}));
router.delete('/admin/categories/:id', asyncRoute(async (request, response) => {
  const id = requireId(request.params.id);
  try {
    const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    if (!result.affectedRows) throw new ApiError(404, 'Category not found.');
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') throw new ApiError(409, 'This category is used by an event. Move those events to another category before deleting it.');
    throw error;
  }
  response.status(204).end();
}));
module.exports = router;
