require('express-async-errors');
const express = require('express');
const cors = require('cors');

const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LifeFeed API is running' });
});

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/tasks', require('./src/routes/taskRoutes'));
app.use('/api/feed', require('./src/routes/feedRoutes'));
app.use('/api/streak', require('./src/routes/streakRoutes'));

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
