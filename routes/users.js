const express = require('express');
const router = express.Router();

// In-memory user storage
let users = [];
let nextId = 1;

/**
 * GET /api/users
 * Returns list of all registered users
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    count: users.length,
    data: users
  });
});

/**
 * GET /api/users/:id
 * Returns a single user by ID
 */
router.get('/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: `User with ID ${req.params.id} not found`
    });
  }

  res.status(200).json({
    status: 'success',
    data: user
  });
});

/**
 * POST /api/users
 * Registers and saves a new user
 * Required fields in JSON body: name, email
 */
router.post('/', (req, res) => {
  const { name, email, role, department, graduationYear } = req.body;

  // Validation: name and email are mandatory
  if (!name || !email) {
    return res.status(400).json({
      status: 'fail',
      message: 'Name and email are required fields'
    });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide a valid email address'
    });
  }

  // Duplicate email check
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({
      status: 'fail',
      message: 'A user with this email already exists'
    });
  }

  // Create new user object
  const newUser = {
    id: nextId++,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: role || 'Alumni',
    department: department || null,
    graduationYear: graduationYear ? Number(graduationYear) : null,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  res.status(201).json({
    status: 'success',
    message: 'User created successfully',
    data: newUser
  });
});

/**
 * PATCH /api/users/:id
 * Partially updates an existing user
 */
router.patch('/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const updateData = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid user ID'
    });
  }

  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({
      status: 'fail',
      message: `User with ID ${userId} not found`
    });
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'No update data provided in request body'
    });
  }

  users[userIndex] = {
    ...users[userIndex],
    ...updateData,
    id: userId,
    updatedAt: new Date().toISOString()
  };

  res.status(200).json({
    status: 'success',
    message: `User with ID ${userId} updated successfully`,
    data: users[userIndex]
  });
});

/**
 * PUT /api/users/:id
 * Updates an existing user via PUT
 */
router.put('/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const updateData = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid user ID'
    });
  }

  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({
      status: 'fail',
      message: `User with ID ${userId} not found`
    });
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'No update data provided in request body'
    });
  }

  users[userIndex] = {
    ...users[userIndex],
    ...updateData,
    id: userId,
    updatedAt: new Date().toISOString()
  };

  res.status(200).json({
    status: 'success',
    message: `User with ID ${userId} updated successfully via PUT`,
    data: users[userIndex]
  });
});

/**
 * DELETE /api/users/:id
 * Deletes a user by ID
 */
router.delete('/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid user ID'
    });
  }

  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({
      status: 'fail',
      message: `User with ID ${userId} not found`
    });
  }

  const [deletedUser] = users.splice(userIndex, 1);

  res.status(200).json({
    status: 'success',
    message: `User with ID ${userId} deleted successfully`,
    deletedUser: deletedUser
  });
});

module.exports = router;


