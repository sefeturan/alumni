const express = require('express');
// mergeParams: true allows accessing :jobId from the parent router
const router = express.Router({ mergeParams: true });
const ApiApplicationController = require('../controllers/ApiApplicationController');

/**
 * RESTful API Nested Routes: Applications submitted to a specific JobPosting
 * Mounted at: /api/jobs/:jobId/applications
 */

// GET /api/jobs/:jobId/applications - List all applications for this job
router.get('/', ApiApplicationController.getJobApplications);

// POST /api/jobs/:jobId/applications - Submit an application to this job
router.post('/', ApiApplicationController.applyToJob);

module.exports = router;
