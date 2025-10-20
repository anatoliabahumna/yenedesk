const express = require('express');
const app = express();
const PORT = 3001;

// Initialize database
require('./database');

// Middleware
app.use(express.json());

// Routes
app.use('/api/notes', require('./routes/notes'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/fitness', require('./routes/fitness'));
app.use('/api/meal', require('./routes/meals'));
app.use('/api/pc', require('./routes/pc'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

