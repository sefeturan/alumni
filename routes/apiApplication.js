const express = require('express');
const router = express.Router();
const ApiApplicationController = require('../controllers/ApiApplicationController');

/**
 * RESTful API Application Routes (Direct)
 * Base path: /api/applications
 */

// GET /api/applications - List all applications (supports query filters)
router.get('/', ApiApplicationController.getAllApplications);

// POST /api/applications - Create application directly
router.post('/', ApiApplicationController.createApplication);

// GET /api/applications/:id - Get a single application by ID
router.get('/:id', ApiApplicationController.getApplicationById);

// PUT /api/applications/:id - Update application status/details
router.put('/:id', ApiApplicationController.updateApplication);

// PATCH /api/applications/:id - Partial update application status/details
router.patch('/:id', ApiApplicationController.updateApplication);

// DELETE /api/applications/:id - Delete application
router.delete('/:id', ApiApplicationController.deleteApplication);

module.exports = router;
