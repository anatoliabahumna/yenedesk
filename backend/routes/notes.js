const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all notes
router.get('/', (req, res) => {
  try {
    const notes = db.prepare('SELECT * FROM notes ORDER BY updated_at DESC').all();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create note
router.post('/', (req, res) => {
  try {
    const { title, content } = req.body;
    const stmt = db.prepare('INSERT INTO notes (title, content) VALUES (?, ?)');
    const result = stmt.run(title, content || '');
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update note
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const stmt = db.prepare(
      'UPDATE notes SET title = ?, content = ?, updated_at = datetime(\'now\') WHERE id = ?'
    );
    const result = stmt.run(title, content || '', id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id);
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE note
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM notes WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

