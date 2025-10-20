const express = require('express');
const router = express.Router();
const db = require('../database');

// Categories routes
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM finance_categories ORDER BY created_at DESC').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', (req, res) => {
  try {
    const { name, kind } = req.body;
    if (!['income', 'expense'].includes(kind)) {
      return res.status(400).json({ error: 'Kind must be income or expense' });
    }
    const stmt = db.prepare('INSERT INTO finance_categories (name, kind) VALUES (?, ?)');
    const result = stmt.run(name, kind);
    const category = db.prepare('SELECT * FROM finance_categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, kind } = req.body;
    if (kind && !['income', 'expense'].includes(kind)) {
      return res.status(400).json({ error: 'Kind must be income or expense' });
    }
    const stmt = db.prepare('UPDATE finance_categories SET name = ?, kind = ? WHERE id = ?');
    const result = stmt.run(name, kind, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const category = db.prepare('SELECT * FROM finance_categories WHERE id = ?').get(id);
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    // Check if category has transactions
    const count = db.prepare('SELECT COUNT(*) as count FROM finance_transactions WHERE category_id = ?').get(id);
    if (count.count > 0) {
      return res.status(409).json({ error: 'Cannot delete category with existing transactions' });
    }
    const stmt = db.prepare('DELETE FROM finance_categories WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transactions routes
router.get('/transactions', (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name, c.kind as category_kind
      FROM finance_transactions t
      JOIN finance_categories c ON t.category_id = c.id
      ORDER BY t.date DESC, t.created_at DESC
    `).all();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transactions', (req, res) => {
  try {
    const { category_id, amount, date, note } = req.body;
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    const stmt = db.prepare('INSERT INTO finance_transactions (category_id, amount, date, note) VALUES (?, ?, ?, ?)');
    const result = stmt.run(category_id, amount, date, note || '');
    const transaction = db.prepare(`
      SELECT t.*, c.name as category_name, c.kind as category_kind
      FROM finance_transactions t
      JOIN finance_categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, amount, date, note } = req.body;
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    const stmt = db.prepare('UPDATE finance_transactions SET category_id = ?, amount = ?, date = ?, note = ? WHERE id = ?');
    const result = stmt.run(category_id, amount, date, note || '', id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    const transaction = db.prepare(`
      SELECT t.*, c.name as category_name, c.kind as category_kind
      FROM finance_transactions t
      JOIN finance_categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id);
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/transactions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM finance_transactions WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

