const express = require('express');
const router = express.Router();
const db = require('../database');

// Recipes routes
router.get('/recipes', (req, res) => {
  try {
    const recipes = db.prepare('SELECT * FROM meal_recipes ORDER BY created_at DESC').all();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/recipes', (req, res) => {
  try {
    const { title, ingredients, steps } = req.body;
    const stmt = db.prepare('INSERT INTO meal_recipes (title, ingredients, steps) VALUES (?, ?, ?)');
    const result = stmt.run(title, ingredients || '', steps || '');
    const recipe = db.prepare('SELECT * FROM meal_recipes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/recipes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, ingredients, steps } = req.body;
    const stmt = db.prepare('UPDATE meal_recipes SET title = ?, ingredients = ?, steps = ? WHERE id = ?');
    const result = stmt.run(title, ingredients || '', steps || '', id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    const recipe = db.prepare('SELECT * FROM meal_recipes WHERE id = ?').get(id);
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/recipes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM meal_recipes WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meal plans routes
router.get('/plans', (req, res) => {
  try {
    const plans = db.prepare('SELECT * FROM meal_plans ORDER BY date DESC, created_at DESC').all();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/plans', (req, res) => {
  try {
    const { date, note } = req.body;
    const stmt = db.prepare('INSERT INTO meal_plans (date, note) VALUES (?, ?)');
    const result = stmt.run(date, note || '');
    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { date, note } = req.body;
    const stmt = db.prepare('UPDATE meal_plans SET date = ?, note = ? WHERE id = ?');
    const result = stmt.run(date, note || '', id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }
    const plan = db.prepare('SELECT * FROM meal_plans WHERE id = ?').get(id);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/plans/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM meal_plans WHERE id = ?');
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

