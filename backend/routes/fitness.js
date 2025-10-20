const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all workouts
router.get('/workouts', (req, res) => {
  try {
    const workouts = db.prepare('SELECT * FROM fitness_workouts ORDER BY date DESC, created_at DESC').all();
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create workout
router.post('/workouts', (req, res) => {
  try {
    const { date, note } = req.body;
    const stmt = db.prepare('INSERT INTO fitness_workouts (date, note) VALUES (?, ?)');
    const result = stmt.run(date, note || '');
    const workout = db.prepare('SELECT * FROM fitness_workouts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH update workout
router.patch('/workouts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { date, note } = req.body;
    const stmt = db.prepare('UPDATE fitness_workouts SET date = ?, note = ? WHERE id = ?');
    const result = stmt.run(date, note || '', id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    const workout = db.prepare('SELECT * FROM fitness_workouts WHERE id = ?').get(id);
    res.json(workout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE workout
router.delete('/workouts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM fitness_workouts WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

