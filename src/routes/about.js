const express = require('express');
const path = require('path');
const router = express.Router();

/**
 * GET /about
 * Serves the About page for Alumni Network Platform
 */
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'about.html'));
});

module.exports = router;
