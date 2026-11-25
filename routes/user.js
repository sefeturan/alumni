const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

/**
 * Web / MVC User Routes with View Layer
 * Base path: /users
 *
 * Full CRUD Operations:
 * - [R] GET  /users            -> List all users (src/views/users.html)
 * - [C] POST /users            -> Create new user form submission & redirect
 * - [R] GET  /users/:id        -> Show user profile detail (src/views/user-detail.html)
 * - [U] GET  /users/:id/edit   -> Show user edit form (src/views/user-edit.html)
 * - [U] POST /users/:id/update -> Process update & redirect to detail view
 * - [U] PUT  /users/:id        -> Process update (API / REST fallback)
 * - [D] POST /users/:id/delete -> Process deletion & redirect to list view
 * - [D] DELETE /users/:id      -> Process deletion (API / REST fallback)
 */

// READ ALL: List all users
router.get('/', UserController.index);

// CREATE: Process user registration from form
router.post('/', UserController.create);

// READ ONE: View specific user profile detail
router.get('/:id', UserController.show);

// EDIT VIEW: View user edit form
router.get('/:id/edit', UserController.edit);

// UPDATE: Process user update from form
router.post('/:id/update', UserController.update);
router.put('/:id', UserController.update);

// DELETE: Process user deletion
router.post('/:id/delete', UserController.destroy);
router.delete('/:id', UserController.destroy);

module.exports = router;
