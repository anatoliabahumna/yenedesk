const express = require('express');
const router = express.Router();
const db = require('../database');

// Parts plan
router.get('/parts', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM pc_parts_plan ORDER BY created_at DESC, id DESC').all();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/parts', (req, res) => {
  try {
    const { category, part_name, store, price, url, note } = req.body;
    const stmt = db.prepare('INSERT INTO pc_parts_plan (category, part_name, store, price, url, note) VALUES (?, ?, ?, ?, ?, ?)');
    const result = stmt.run(category, part_name, store || '', price || 0, url || '', note || '');
    const row = db.prepare('SELECT * FROM pc_parts_plan WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/parts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { category, part_name, store, price, url, note } = req.body;
    const stmt = db.prepare('UPDATE pc_parts_plan SET category = ?, part_name = ?, store = ?, price = ?, url = ?, note = ? WHERE id = ?');
    const result = stmt.run(category, part_name, store || '', price || 0, url || '', note || '', id);
    if (result.changes === 0) return res.status(404).json({ error: 'Part not found' });
    const row = db.prepare('SELECT * FROM pc_parts_plan WHERE id = ?').get(id);
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/parts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM pc_parts_plan WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Part not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Orders log
router.get('/orders', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM pc_orders ORDER BY date DESC, created_at DESC').all();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/orders', (req, res) => {
  try {
    const { item, date, store, price, status, courier, tracking_number, note } = req.body;
    const stmt = db.prepare('INSERT INTO pc_orders (item, date, store, price, status, courier, tracking_number, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(item, date, store, price || 0, status, courier || '', tracking_number || '', note || '');
    const row = db.prepare('SELECT * FROM pc_orders WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { item, date, store, price, status, courier, tracking_number, note } = req.body;
    const stmt = db.prepare('UPDATE pc_orders SET item = ?, date = ?, store = ?, price = ?, status = ?, courier = ?, tracking_number = ?, note = ? WHERE id = ?');
    const result = stmt.run(item, date, store, price || 0, status, courier || '', tracking_number || '', note || '', id);
    if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
    const row = db.prepare('SELECT * FROM pc_orders WHERE id = ?').get(id);
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM pc_orders WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Order not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


