require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'X-User-Id'],
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static demo UI if requested directly
app.use(express.static(path.join(__dirname, 'public')));

// Mount Central Extensible API Router
app.use('/api', apiRoutes);

// Root information endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Luman AI Backend Server',
    version: '2.0.0',
    database: 'MongoDB',
    status: 'online',
    endpoints: {
      health: '/api/health',
      flashcards: '/api/flashcards',
      tutor: '/api/tutor',
      auth: '/api/auth',
    },
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Luman Modular AI Backend active on port ${PORT}`);
  console.log(`🌐 API Endpoint: http://localhost:${PORT}/api`);
  console.log(`🗄️ Database: MongoDB Atlas (Connected)`);
  console.log(`=================================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Backend process terminated gracefully.');
  });
});

module.exports = app;