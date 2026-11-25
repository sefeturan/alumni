const express = require('express');
const router = express.Router();
const ApiJobPostingController = require('../controllers/ApiJobPostingController');
const apiJobApplicationRoutes = require('./apiJobApplication');

/**
 * RESTful API Job Posting Routes (Direct)
 * Mounted at: /api/jobs (and /api/job-postings)
 */

// ==========================================
// NESTED RESOURCE ROUTES
// ==========================================
// /api/jobs/:jobId/applications
router.use('/:jobId/applications', apiJobApplicationRoutes);

// ==========================================
// DIRECT JOB CRUD ROUTES
// ==========================================

// GET /api/jobs - List all job postings (supports query filters)
router.get('/', ApiJobPostingController.getAllJobs);

// POST /api/jobs - Create a new job posting directly
router.post('/', ApiJobPostingController.createJob);

// GET /api/jobs/:id - Get a single job posting by ID
router.get('/:id', ApiJobPostingController.getJobById);

// PUT /api/jobs/:id - Update job posting details
router.put('/:id', ApiJobPostingController.updateJob);

// PATCH /api/jobs/:id - Partial update job posting details
router.patch('/:id', ApiJobPostingController.updateJob);

// DELETE /api/jobs/:id - Delete a job posting
router.delete('/:id', ApiJobPostingController.deleteJob);

module.exports = router;
