const express = require('express');
// mergeParams: true allows accessing :userId from the parent router
const router = express.Router({ mergeParams: true });
const ApiApplicationController = require('../controllers/ApiApplicationController');

/**
 * RESTful API Nested Routes: Applications submitted by a specific User
 * Mounted at: /api/users/:userId/applications
 */

// GET /api/users/:userId/applications - List all applications submitted by this user
router.get('/', ApiApplicationController.getUserApplications);

module.exports = router;
