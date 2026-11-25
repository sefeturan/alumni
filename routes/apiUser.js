const express = require('express');
const router = express.Router();
const ApiUserController = require('../controllers/ApiUserController');
const apiUserJobPostingRoutes = require('./apiUserJobPosting');
const apiUserApplicationRoutes = require('./apiUserApplication');

/**
 * RESTful API User Routes
 * Base path: /api/users
 */

// ==========================================
// NESTED RESOURCE ROUTES
// ==========================================
// /api/users/:userId/jobs & /api/users/:userId/job-postings
router.use('/:userId/jobs', apiUserJobPostingRoutes);
router.use('/:userId/job-postings', apiUserJobPostingRoutes);

// /api/users/:userId/applications
router.use('/:userId/applications', apiUserApplicationRoutes);

// ==========================================
// USER CRUD ROUTES
// ==========================================

// GET /api/users - Get all users (supports query filtering: ?role=alumni&department=...)
router.get('/', ApiUserController.getAllUsers);

// POST /api/users - Create a new user
router.post('/', ApiUserController.createUser);

// GET /api/users/:id - Get a user by ID
router.get('/:id', ApiUserController.getUserById);

// PUT /api/users/:id - Update user details
router.put('/:id', ApiUserController.updateUser);

// PATCH /api/users/:id - Partial update user details
router.patch('/:id', ApiUserController.updateUser);

// DELETE /api/users/:id - Delete a user
router.delete('/:id', ApiUserController.deleteUser);

module.exports = router;
