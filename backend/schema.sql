-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Finance categories table
CREATE TABLE IF NOT EXISTS finance_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('income', 'expense')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Finance transactions table
CREATE TABLE IF NOT EXISTS finance_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (category_id) REFERENCES finance_categories(id) ON DELETE RESTRICT
);

-- Fitness workouts table
CREATE TABLE IF NOT EXISTS fitness_workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Meal recipes table
CREATE TABLE IF NOT EXISTS meal_recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  ingredients TEXT,
  steps TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Meal plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- PC build parts planning table
CREATE TABLE IF NOT EXISTS pc_parts_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  part_name TEXT NOT NULL,
  store TEXT,
  price REAL CHECK(price >= 0),
  url TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- PC shopping and returns log
CREATE TABLE IF NOT EXISTS pc_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item TEXT NOT NULL,
  date TEXT NOT NULL,
  store TEXT NOT NULL,
  price REAL CHECK(price >= 0),
  status TEXT NOT NULL CHECK(status IN ('ordered','shipped','delivered','returned','cancelled')),
  courier TEXT,
  tracking_number TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

