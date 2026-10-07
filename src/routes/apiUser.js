const express = require('express');
const router = express.Router();
const ApiUserController = require('../controllers/ApiUserController');

/**
 * RESTful API User Routes
 * Base path: /api/users
 */

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
