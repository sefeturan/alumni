const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Middlewares
const logger = require('./middlewares/logger');
const guardian404 = require('./middlewares/guardian404');
const guardian5xx = require('./middlewares/guardian5xx');

const app = express();
const PORT = process.env.PORT || 5001;

// Global Logger Middleware (raw time, method, route, res type, duration)
app.use(logger);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation Setup (/api-docs & /api/swagger)
const { setupSwagger } = require('./config/swagger');
setupSwagger(app);

// Root route: serves interactive landing page for Alumni Network
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Hello route requested: displays "hello world"
app.get('/hello', (req, res) => {
  res.send('hello world');
});

// Dynamic name parameter route: displays "Hello, {name}"
app.get('/hello/:name', (req, res) => {
  res.send(`Hello, ${req.params.name}`);
});

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Alumni Network API is healthy and running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Sum route module from separate file
const sumRoutes = require('./routes/sum');
app.use('/sum', sumRoutes);

// About page route module from separate file
const aboutRoutes = require('./routes/about');
app.use('/about', aboutRoutes);

// User Web / MVC routes (HTML views & form CRUD)
const userRoutes = require('./routes/user');
app.use('/users', userRoutes);

// User RESTful API routes (JSON responses & API CRUD)
const apiUserRoutes = require('./routes/apiUser');
app.use('/api/users', apiUserRoutes);

// Announcement Web / MVC routes (HTML views & form CRUD)
const announcementRoutes = require('./routes/announcement');
app.use('/announcements', announcementRoutes);

// Announcement RESTful API routes (JSON responses & API CRUD)
const apiAnnouncementRoutes = require('./routes/apiAnnouncement');
app.use('/api/announcements', apiAnnouncementRoutes);

// Job Posting RESTful API direct routes (JSON responses & API CRUD)
const apiJobPostingRoutes = require('./routes/apiJobPosting');
app.use('/api/jobs', apiJobPostingRoutes);
app.use('/api/job-postings', apiJobPostingRoutes);

// Application RESTful API direct routes (JSON responses & API CRUD)
const apiApplicationRoutes = require('./routes/apiApplication');
app.use('/api/applications', apiApplicationRoutes);

// Generic 404 page route
app.get('/404', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// 404 Guardian Middleware (intercepts all unhandled endpoints with reason / redirects invalid web requests)
app.use(guardian404);

// 5xx Guardian Middleware (intercepts unhandled server errors, writes to logs/error.log)
app.use(guardian5xx);

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(PORT) + 1;
      console.error(`Port ${PORT} is in use, retrying on port ${nextPort}...`);
      app.listen(nextPort, () => {
        console.log(`Server is running on http://localhost:${nextPort}`);
      });
    } else {
      console.error(err);
    }
  });
}

module.exports = app;
