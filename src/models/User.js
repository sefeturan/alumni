const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/db');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

/**
 * Ensures data directory exists on the filesystem.
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Local cache for users synchronized with persistent file storage.
 */
const usersStore = new Map();

function loadSync() {
  try {
    ensureDataDir();
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      if (raw.trim()) {
        const usersArray = JSON.parse(raw);
        usersStore.clear();
        for (const u of usersArray) {
          usersStore.set(u.id, new User(u));
        }
      }
    } else {
      fs.writeFileSync(USERS_FILE, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('Failed to load users from file storage:', err.message);
  }
}

async function persistFile() {
  try {
    ensureDataDir();
    const data = Array.from(usersStore.values()).map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      graduationYear: user.graduationYear,
      department: user.department,
      company: user.company,
      title: user.title,
      skills: user.skills,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    await fs.promises.writeFile(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist users to file storage:', err.message);
  }
}

/**
 * Maps a PostgreSQL row (snake_case) to a User instance (camelCase).
 */
function mapRowToUser(row) {
  if (!row) return null;
  return new User({
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password_hash,
    role: row.role,
    graduationYear: row.graduation_year,
    department: row.department,
    company: row.company,
    title: row.title,
    skills: row.skills || [],
    bio: row.bio || '',
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  });
}

/**
 * User Model
 * Represents an Alumni Network User with PostgreSQL & file storage support.
 */
class User {
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

  toJSON() {
    const { password, ...safeUser } = this;
    return safeUser;
  }

  // ==========================================
  // RELATIONSHIPS
  // ==========================================

  /**
   * HAS MANY: Retrieves all JobPostings authored by this User.
   * @returns {Promise<Array>}
   */
  async getJobPostings() {
    const JobPosting = require('./JobPosting');
    return JobPosting.findByUserId(this.id);
  }

  /**
   * HAS MANY (STATIC): Retrieves all JobPostings for a specific user ID.
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  static async getJobPostings(userId) {
    const JobPosting = require('./JobPosting');
    return JobPosting.findByUserId(userId);
  }

  /**
   * HAS MANY: Retrieves all Applications submitted by this User.
   * @returns {Promise<Array>}
   */
  async getApplications() {
    const Application = require('./Application');
    return Application.findByUserId(this.id);
  }

  /**
   * HAS MANY (STATIC): Retrieves all Applications for a specific user ID.
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  static async getApplications(userId) {
    const Application = require('./Application');
    return Application.findByUserId(userId);
  }

  // ==========================================
  // CRUD OPERATIONS WITH DATABASE CONNECTION
  // ==========================================

  /**
   * CREATE: Inserts a new user into PostgreSQL or persistent storage.
   */
  static async create(userData) {
    if (!userData || typeof userData !== 'object') {
      throw new Error('User data is required.');
    }
    if (!userData.name || !userData.email) {
      throw new Error('Name and email are required fields.');
    }

    const normalizedEmail = userData.email.toLowerCase().trim();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      throw new Error(`A user with email "${normalizedEmail}" already exists.`);
    }

    const userInstance = new User(userData);

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = `
        INSERT INTO users (
          id, name, email, password_hash, role, graduation_year,
          department, company, title, skills, bio, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
      `;
      const values = [
        userInstance.id,
        userInstance.name,
        userInstance.email,
        userInstance.password || null,
        userInstance.role,
        userInstance.graduationYear,
        userInstance.department,
        userInstance.company,
        userInstance.title,
        userInstance.skills,
        userInstance.bio,
        userInstance.createdAt,
        userInstance.updatedAt
      ];

      const { rows } = await db.query(sql, values);
      const createdUser = mapRowToUser(rows[0]);
      usersStore.set(createdUser.id, createdUser);
      await persistFile();
      return createdUser;
    }

    // Fallback storage
    usersStore.set(userInstance.id, userInstance);
    await persistFile();
    return userInstance;
  }

  /**
   * READ ALL: Retrieves all users with optional query filtering.
   */
  static async findAll(filter = {}) {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const conditions = [];
      const values = [];

      if (filter.role) {
        values.push(filter.role);
        conditions.push(`LOWER(role) = LOWER($${values.length})`);
      }
      if (filter.department) {
        values.push(`%${filter.department}%`);
        conditions.push(`department ILIKE $${values.length}`);
      }
      if (filter.company) {
        values.push(`%${filter.company}%`);
        conditions.push(`company ILIKE $${values.length}`);
      }
      if (filter.graduationYear) {
        values.push(Number(filter.graduationYear));
        conditions.push(`graduation_year = $${values.length}`);
      }

      let sql = 'SELECT * FROM users';
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY created_at DESC';

      const { rows } = await db.query(sql, values);
      return rows.map(mapRowToUser);
    }

    // Fallback storage
    let results = Array.from(usersStore.values());
    const filterKeys = Object.keys(filter);
    if (filterKeys.length > 0) {
      results = results.filter((user) => {
        return filterKeys.every((key) => {
          if (filter[key] === undefined || filter[key] === null) return true;
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
   * READ ONE: Retrieves a single user by ID.
   */
  static async findById(id) {
    if (!id) return null;

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = 'SELECT * FROM users WHERE id = $1 LIMIT 1;';
      const { rows } = await db.query(sql, [id]);
      if (rows.length === 0) return null;
      return mapRowToUser(rows[0]);
    }

    return usersStore.get(String(id)) || null;
  }

  /**
   * READ ONE: Retrieves a user by their email address.
   */
  static async findByEmail(email) {
    if (!email) return null;
    const normalizedEmail = String(email).toLowerCase().trim();

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = 'SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1;';
      const { rows } = await db.query(sql, [normalizedEmail]);
      if (rows.length === 0) return null;
      return mapRowToUser(rows[0]);
    }

    for (const user of usersStore.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  /**
   * UPDATE: Updates user fields in PostgreSQL or fallback storage.
   */
  static async findByIdAndUpdate(id, updateData) {
    if (!id || !updateData || typeof updateData !== 'object') {
      return this.findById(id);
    }

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const existing = await this.findById(id);
      if (!existing) return null;

      if (updateData.email) {
        const normalizedEmail = updateData.email.toLowerCase().trim();
        const conflict = await this.findByEmail(normalizedEmail);
        if (conflict && conflict.id !== id) {
          throw new Error(`Email "${normalizedEmail}" is already in use by another account.`);
        }
      }

      const updates = [];
      const values = [];

      const fieldMappings = {
        name: 'name',
        email: 'email',
        password: 'password_hash',
        role: 'role',
        graduationYear: 'graduation_year',
        department: 'department',
        company: 'company',
        title: 'title',
        skills: 'skills',
        bio: 'bio'
      };

      for (const [prop, column] of Object.entries(fieldMappings)) {
        if (updateData[prop] !== undefined) {
          values.push(prop === 'email' ? updateData.email.toLowerCase().trim() : updateData[prop]);
          updates.push(`${column} = $${values.length}`);
        }
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const sql = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${values.length}
        RETURNING *;
      `;

      const { rows } = await db.query(sql, values);
      const updatedUser = mapRowToUser(rows[0]);
      usersStore.set(updatedUser.id, updatedUser);
      await persistFile();
      return updatedUser;
    }

    // Fallback storage
    const user = await this.findById(id);
    if (!user) return null;

    if (updateData.email) {
      const normalizedEmail = updateData.email.toLowerCase().trim();
      const existing = await this.findByEmail(normalizedEmail);
      if (existing && existing.id !== user.id) {
        throw new Error(`Email "${normalizedEmail}" is already in use by another account.`);
      }
      user.email = normalizedEmail;
    }

    const updatableFields = [
      'name', 'password', 'role', 'graduationYear', 'department',
      'company', 'title', 'skills', 'bio'
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
    await persistFile();
    return user;
  }

  /**
   * DELETE: Deletes a user by ID from PostgreSQL or storage.
   */
  static async findByIdAndDelete(id) {
    if (!id) return null;

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = 'DELETE FROM users WHERE id = $1 RETURNING *;';
      const { rows } = await db.query(sql, [id]);
      if (rows.length === 0) return null;
      usersStore.delete(id);
      await persistFile();
      return mapRowToUser(rows[0]);
    }

    const user = await this.findById(id);
    if (!user) return null;

    usersStore.delete(user.id);
    await persistFile();
    return user;
  }

  /**
   * UTILITY: Returns total number of users.
   */
  static async count() {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM users;');
      return rows[0].count;
    }
    return usersStore.size;
  }

  /**
   * UTILITY: Clears all users.
   */
  static async clear() {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      await db.query('DELETE FROM users;');
    }
    usersStore.clear();
    await persistFile();
  }

  /**
   * UTILITY: Reloads in-memory storage from persistent source.
   */
  static async reload() {
    loadSync();
  }
}

// Initial sync
loadSync();

module.exports = User;
