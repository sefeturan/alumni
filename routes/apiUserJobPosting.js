const express = require('express');
// mergeParams: true enables access to :userId from the parent router
const router = express.Router({ mergeParams: true });
const ApiJobPostingController = require('../controllers/ApiJobPostingController');

/**
 * RESTful API Nested Routes: Jobs authored by a specific User
 * Mounted at: /api/users/:userId/jobs
 */

// GET /api/users/:userId/jobs - List all job postings authored by this user
router.get('/', ApiJobPostingController.getUserJobs);

// POST /api/users/:userId/jobs - Create a new job posting authored by this user
router.post('/', ApiJobPostingController.createUserJob);

// GET /api/users/:userId/jobs/:jobId - Get a specific job posting authored by this user
router.get('/:jobId', ApiJobPostingController.getUserJobById);

// DELETE /api/users/:userId/jobs/:jobId - Delete a specific job posting authored by this user
router.delete('/:jobId', ApiJobPostingController.deleteUserJob);

module.exports = router;
