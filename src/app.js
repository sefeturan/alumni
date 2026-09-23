const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route: serves the temporary interactive landing page for Alumni Network
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Sum route module from separate file
const sumRoutes = require('./routes/sum');
app.use('/sum', sumRoutes);

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
