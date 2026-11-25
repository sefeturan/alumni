const User = require('../models/User');

/**
 * ApiUserController
 * Handles RESTful JSON API requests for User CRUD operations.
 * Returns standard JSON responses with appropriate HTTP status codes.
 */
class ApiUserController {
  /**
   * READ ALL: Get all users with optional query filtering
   * GET /api/users?role=alumni&department=Computer+Science
   */
  static async getAllUsers(req, res) {
    try {
      const filter = { ...req.query };
      const users = await User.findAll(filter);

      return res.status(200).json({
        success: true,
        count: users.length,
        data: users.map(user => user.toJSON ? user.toJSON() : user)
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve users.',
        error: error.message
      });
    }
  }

  /**
   * READ ONE: Get a single user by ID
   * GET /api/users/:id
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `User with ID "${id}" was not found.`
        });
      }

      return res.status(200).json({
        success: true,
        data: user.toJSON ? user.toJSON() : user
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user.',
        error: error.message
      });
    }
  }

  /**
   * CREATE: Create a new user
   * POST /api/users
   */
  static async createUser(req, res) {
    try {
      const { name, email, password, role, graduationYear, department, company, title, skills, bio } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Name and email are required fields.'
        });
      }

      const newUser = await User.create({
        name,
        email,
        password,
        role,
        graduationYear,
        department,
        company,
        title,
        skills,
        bio
      });

      return res.status(201).json({
        success: true,
        message: 'User created successfully.',
        data: newUser.toJSON ? newUser.toJSON() : newUser
      });
    } catch (error) {
      const status = error.message.includes('already exists') ? 409 : 400;
      return res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UPDATE: Update an existing user by ID
   * PUT /api/users/:id or PATCH /api/users/:id
   */
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const existingUser = await User.findById(id);

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: `User with ID "${id}" was not found.`
        });
      }

      const updatedUser = await User.findByIdAndUpdate(id, req.body);

      return res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        data: updatedUser.toJSON ? updatedUser.toJSON() : updatedUser
      });
    } catch (error) {
      const status = error.message.includes('already in use') ? 409 : 400;
      return res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE: Delete an existing user by ID
   * DELETE /api/users/:id
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deletedUser = await User.findByIdAndDelete(id);

      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: `User with ID "${id}" was not found.`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully.',
        data: deletedUser.toJSON ? deletedUser.toJSON() : deletedUser
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user.',
        error: error.message
      });
    }
  }
}

module.exports = ApiUserController;
