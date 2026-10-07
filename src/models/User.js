const crypto = require('crypto');

/**
 * In-memory storage for users without requiring an external database connection.
 * Stores User instances indexed in memory.
 */
const usersStore = new Map();

/**
 * User Model
 * Represents an Alumni Network User with full in-memory CRUD operations.
 */
class User {
  /**
   * @param {Object} data - User creation data
   */
  constructor({
    id,
    name,
    email,
    password,
    role = 'alumni',
    graduationYear,
    department,
    company,
    title,
    skills = [],
    bio = '',
    createdAt,
    updatedAt
  }) {
    this.id = id || crypto.randomUUID();
    this.name = name;
    this.email = email ? email.toLowerCase().trim() : '';
    this.password = password;
    this.role = role; // 'student' | 'alumni' | 'admin'
    this.graduationYear = graduationYear ? Number(graduationYear) : null;
    this.department = department || null;
    this.company = company || null;
    this.title = title || null;
    this.skills = Array.isArray(skills) ? skills : [];
    this.bio = bio || '';
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  /**
   * Sanitizes user object by stripping sensitive fields (e.g. password).
   * @returns {Object} Public user data
   */
  toJSON() {
    const { password, ...safeUser } = this;
    return safeUser;
  }

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  /**
   * CREATE: Create and persist a new user in memory.
   * @param {Object} userData - User fields
   * @returns {Promise<User>} Newly created User instance
   */
  static async create(userData) {
    if (!userData || typeof userData !== 'object') {
      throw new Error('User data is required.');
    }

    if (!userData.name || !userData.email) {
      throw new Error('Name and email are required fields.');
    }

    const normalizedEmail = userData.email.toLowerCase().trim();

    // Check email uniqueness
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error(`A user with email "${normalizedEmail}" already exists.`);
    }

    const newUser = new User(userData);
    usersStore.set(newUser.id, newUser);
    return newUser;
  }

  /**
   * READ: Find all users, optionally filtered by matching properties.
   * @param {Object} [filter={}] - Filter criteria (e.g. { role: 'alumni', department: 'Computer Science' })
   * @returns {Promise<User[]>} Array of User instances
   */
  static async findAll(filter = {}) {
    let results = Array.from(usersStore.values());

    const filterKeys = Object.keys(filter);
    if (filterKeys.length > 0) {
      results = results.filter((user) => {
        return filterKeys.every((key) => {
          if (filter[key] === undefined || filter[key] === null) return true;
          // Case-insensitive comparison for strings
          if (typeof user[key] === 'string' && typeof filter[key] === 'string') {
            return user[key].toLowerCase() === filter[key].toLowerCase();
          }
          return user[key] === filter[key];
        });
      });
    }

    return results;
  }

  /**
   * READ: Find a user by their unique ID.
   * @param {string} id - User ID
   * @returns {Promise<User|null>} User instance or null if not found
   */
  static async findById(id) {
    if (!id) return null;
    return usersStore.get(String(id)) || null;
  }

  /**
   * READ: Find a user by their email address.
   * @param {string} email - User email
   * @returns {Promise<User|null>} User instance or null if not found
   */
  static async findByEmail(email) {
    if (!email) return null;
    const normalizedEmail = String(email).toLowerCase().trim();

    for (const user of usersStore.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  /**
   * UPDATE: Find a user by ID and update their properties.
   * @param {string} id - User ID to update
   * @param {Object} updateData - Fields to update
   * @returns {Promise<User|null>} Updated User instance or null if not found
   */
  static async findByIdAndUpdate(id, updateData) {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    if (!updateData || typeof updateData !== 'object') {
      return user;
    }

    // If email is being changed, ensure it's not taken by someone else
    if (updateData.email) {
      const normalizedEmail = updateData.email.toLowerCase().trim();
      const existing = await this.findByEmail(normalizedEmail);
      if (existing && existing.id !== user.id) {
        throw new Error(`Email "${normalizedEmail}" is already in use by another account.`);
      }
      user.email = normalizedEmail;
    }

    // Allowed updatable fields
    const updatableFields = [
      'name',
      'password',
      'role',
      'graduationYear',
      'department',
      'company',
      'title',
      'skills',
      'bio'
    ];

    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        if (field === 'skills' && Array.isArray(updateData.skills)) {
          user.skills = updateData.skills;
        } else if (field === 'graduationYear') {
          user.graduationYear = updateData.graduationYear ? Number(updateData.graduationYear) : null;
        } else {
          user[field] = updateData[field];
        }
      }
    }

    user.updatedAt = new Date().toISOString();
    usersStore.set(user.id, user);

    return user;
  }

  /**
   * DELETE: Find a user by ID and remove them from memory.
   * @param {string} id - User ID to delete
   * @returns {Promise<User|null>} The deleted User instance or null if not found
   */
  static async findByIdAndDelete(id) {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    usersStore.delete(user.id);
    return user;
  }

  /**
   * UTILITY: Return the total count of users in memory.
   * @returns {Promise<number>}
   */
  static async count() {
    return usersStore.size;
  }

  /**
   * UTILITY: Clear all users from memory (useful for testing).
   * @returns {Promise<void>}
   */
  static async clear() {
    usersStore.clear();
  }
}

module.exports = User;
