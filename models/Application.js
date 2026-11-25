const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/db');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');

/**
 * Ensures data directory exists on the filesystem.
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Local cache for applications synchronized with persistent file storage.
 */
const applicationsStore = new Map();

function loadSync() {
  try {
    ensureDataDir();
    if (fs.existsSync(APPLICATIONS_FILE)) {
      const raw = fs.readFileSync(APPLICATIONS_FILE, 'utf-8');
      if (raw.trim()) {
        const arr = JSON.parse(raw);
        applicationsStore.clear();
        for (const item of arr) {
          applicationsStore.set(item.id, new Application(item));
        }
      }
    } else {
      fs.writeFileSync(APPLICATIONS_FILE, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('Failed to load applications from file storage:', err.message);
  }
}

async function persistFile() {
  try {
    ensureDataDir();
    const data = Array.from(applicationsStore.values()).map(app => ({
      id: app.id,
      jobId: app.jobId,
      userId: app.userId,
      resumeUrl: app.resumeUrl,
      coverLetter: app.coverLetter,
      status: app.status,
      notes: app.notes,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));
    await fs.promises.writeFile(APPLICATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist applications to file storage:', err.message);
  }
}

/**
 * Maps a PostgreSQL row (snake_case) to an Application instance (camelCase).
 */
function mapRowToApplication(row) {
  if (!row) return null;
  const instance = new Application({
    id: row.id,
    jobId: row.job_id,
    userId: row.user_id,
    resumeUrl: row.resume_url,
    coverLetter: row.cover_letter,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  });

  if (row.job && typeof row.job === 'object' && row.job.id) {
    instance.job = row.job;
  }
  if (row.applicant && typeof row.applicant === 'object' && row.applicant.id) {
    instance.applicant = row.applicant;
  }

  return instance;
}

/**
 * Application Model
 * Represents a user's application to a JobPosting with PostgreSQL & file storage support.
 */
class Application {
  constructor({
    id,
    jobId,
    userId,
    resumeUrl = null,
    coverLetter = '',
    status = 'pending',
    notes = null,
    createdAt,
    updatedAt,
    job = null,
    applicant = null
  }) {
    this.id = id || crypto.randomUUID();
    this.jobId = jobId;
    this.userId = userId;
    this.resumeUrl = resumeUrl || null;
    this.coverLetter = coverLetter ? String(coverLetter).trim() : '';
    this.status = status; // 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'withdrawn'
    this.notes = notes || null;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    if (job) this.job = job;
    if (applicant) this.applicant = applicant;
  }

  // ==========================================
  // RELATIONSHIPS
  // ==========================================

  /**
   * BELONGS TO: Retrieves the JobPosting for this application.
   */
  async getJob() {
    if (!this.jobId) return null;
    const JobPosting = require('./JobPosting');
    return JobPosting.findById(this.jobId);
  }

  /**
   * BELONGS TO: Retrieves the User who submitted this application.
   */
  async getUser() {
    if (!this.userId) return null;
    const User = require('./User');
    return User.findById(this.userId);
  }

  // ==========================================
  // CRUD OPERATIONS WITH DATABASE CONNECTION
  // ==========================================

  /**
   * CREATE: Submits a new job application.
   */
  static async create(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Başvuru verisi gereklidir.');
    }
    if (!data.jobId || !data.userId) {
      throw new Error('jobId ve userId alanları zorunludur.');
    }

    // Verify uniqueness
    const existing = await this.findByJobAndUser(data.jobId, data.userId);
    if (existing) {
      throw new Error('Bu kullanıcı bu ilana zaten başvuruda bulunmuş.');
    }

    const instance = new Application(data);

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = `
        INSERT INTO applications (
          id, job_id, user_id, resume_url, cover_letter, status, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;
      const values = [
        instance.id,
        instance.jobId,
        instance.userId,
        instance.resumeUrl,
        instance.coverLetter,
        instance.status,
        instance.notes,
        instance.createdAt,
        instance.updatedAt
      ];

      const { rows } = await db.query(sql, values);
      const created = mapRowToApplication(rows[0]);
      applicationsStore.set(created.id, created);
      await persistFile();
      return created;
    }

    // Fallback storage
    applicationsStore.set(instance.id, instance);
    await persistFile();
    return instance;
  }

  /**
   * READ ALL: Retrieves all applications with optional filters.
   */
  static async findAll(filter = {}) {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const conditions = [];
      const values = [];

      if (filter.jobId) {
        values.push(filter.jobId);
        conditions.push(`a.job_id = $${values.length}`);
      }
      if (filter.userId) {
        values.push(filter.userId);
        conditions.push(`a.user_id = $${values.length}`);
      }
      if (filter.status) {
        values.push(filter.status);
        conditions.push(`a.status = $${values.length}`);
      }

      let sql = `
        SELECT a.*,
               json_build_object(
                 'id', j.id,
                 'title', j.title,
                 'company', j.company,
                 'location', j.location
               ) AS job,
               json_build_object(
                 'id', u.id,
                 'name', u.name,
                 'email', u.email,
                 'department', u.department
               ) AS applicant
        FROM applications a
        LEFT JOIN job_postings j ON a.job_id = j.id
        LEFT JOIN users u ON a.user_id = u.id
      `;

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY a.created_at DESC';

      const { rows } = await db.query(sql, values);
      return rows.map(mapRowToApplication);
    }

    // Fallback storage
    let results = Array.from(applicationsStore.values());
    const filterKeys = Object.keys(filter);
    if (filterKeys.length > 0) {
      results = results.filter((app) => {
        return filterKeys.every((key) => {
          if (filter[key] === undefined || filter[key] === null || filter[key] === '') return true;
          return String(app[key]) === String(filter[key]);
        });
      });
    }

    // Populate relations in fallback
    const User = require('./User');
    const JobPosting = require('./JobPosting');
    for (const app of results) {
      if (!app.applicant && app.userId) {
        const u = await User.findById(app.userId);
        if (u) app.applicant = u.toJSON ? u.toJSON() : u;
      }
      if (!app.job && app.jobId) {
        const j = await JobPosting.findById(app.jobId);
        if (j) app.job = j;
      }
    }

    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * READ ONE: Retrieves an application by ID.
   */
  static async findById(id) {
    if (!id) return null;

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = `
        SELECT a.*,
               json_build_object(
                 'id', j.id,
                 'title', j.title,
                 'company', j.company,
                 'location', j.location
               ) AS job,
               json_build_object(
                 'id', u.id,
                 'name', u.name,
                 'email', u.email,
                 'department', u.department
               ) AS applicant
        FROM applications a
        LEFT JOIN job_postings j ON a.job_id = j.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.id = $1
        LIMIT 1;
      `;
      const { rows } = await db.query(sql, [id]);
      if (rows.length === 0) return null;
      return mapRowToApplication(rows[0]);
    }

    const app = applicationsStore.get(String(id)) || null;
    if (app) {
      const User = require('./User');
      const JobPosting = require('./JobPosting');
      if (!app.applicant && app.userId) {
        const u = await User.findById(app.userId);
        if (u) app.applicant = u.toJSON ? u.toJSON() : u;
      }
      if (!app.job && app.jobId) {
        const j = await JobPosting.findById(app.jobId);
        if (j) app.job = j;
      }
    }
    return app;
  }

  /**
   * READ BY JOB: Retrieves all applications for a specific JobPosting.
   */
  static async findByJobId(jobId) {
    if (!jobId) return [];
    return this.findAll({ jobId });
  }

  /**
   * READ BY USER: Retrieves all applications submitted by a specific User.
   */
  static async findByUserId(userId) {
    if (!userId) return [];
    return this.findAll({ userId });
  }

  /**
   * READ UNIQUE: Finds an application by job and user pair.
   */
  static async findByJobAndUser(jobId, userId) {
    if (!jobId || !userId) return null;

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = 'SELECT * FROM applications WHERE job_id = $1 AND user_id = $2 LIMIT 1;';
      const { rows } = await db.query(sql, [jobId, userId]);
      if (rows.length === 0) return null;
      return mapRowToApplication(rows[0]);
    }

    for (const app of applicationsStore.values()) {
      if (app.jobId === jobId && app.userId === userId) {
        return app;
      }
    }
    return null;
  }

  /**
   * UPDATE: Updates application details or status.
   */
  static async findByIdAndUpdate(id, updateData) {
    if (!id || !updateData || typeof updateData !== 'object') {
      return this.findById(id);
    }

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const existing = await this.findById(id);
      if (!existing) return null;

      const updates = [];
      const values = [];

      const fieldMappings = {
        resumeUrl: 'resume_url',
        coverLetter: 'cover_letter',
        status: 'status',
        notes: 'notes'
      };

      for (const [prop, column] of Object.entries(fieldMappings)) {
        if (updateData[prop] !== undefined) {
          values.push(updateData[prop]);
          updates.push(`${column} = $${values.length}`);
        }
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const sql = `
        UPDATE applications
        SET ${updates.join(', ')}
        WHERE id = $${values.length}
        RETURNING *;
      `;

      const { rows } = await db.query(sql, values);
      const updated = mapRowToApplication(rows[0]);
      applicationsStore.set(updated.id, updated);
      await persistFile();
      return updated;
    }

    // Fallback storage
    const app = await this.findById(id);
    if (!app) return null;

    const updatableFields = ['resumeUrl', 'coverLetter', 'status', 'notes'];
    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        app[field] = updateData[field];
      }
    }

    app.updatedAt = new Date().toISOString();
    applicationsStore.set(app.id, app);
    await persistFile();
    return app;
  }

  /**
   * DELETE: Deletes an application by ID.
   */
  static async findByIdAndDelete(id) {
    if (!id) return null;

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = 'DELETE FROM applications WHERE id = $1 RETURNING *;';
      const { rows } = await db.query(sql, [id]);
      if (rows.length === 0) return null;
      applicationsStore.delete(id);
      await persistFile();
      return mapRowToApplication(rows[0]);
    }

    const app = await this.findById(id);
    if (!app) return null;

    applicationsStore.delete(app.id);
    await persistFile();
    return app;
  }

  /**
   * UTILITY: Returns total number of applications.
   */
  static async count(filter = {}) {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      let sql = 'SELECT COUNT(*)::int AS count FROM applications';
      const conditions = [];
      const values = [];

      if (filter.jobId) {
        values.push(filter.jobId);
        conditions.push(`job_id = $${values.length}`);
      }
      if (filter.userId) {
        values.push(filter.userId);
        conditions.push(`user_id = $${values.length}`);
      }
      if (filter.status) {
        values.push(filter.status);
        conditions.push(`status = $${values.length}`);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      const { rows } = await db.query(sql, values);
      return rows[0].count;
    }

    if (filter.jobId || filter.userId || filter.status) {
      return (await this.findAll(filter)).length;
    }
    return applicationsStore.size;
  }

  /**
   * UTILITY: Clears all applications.
   */
  static async clear() {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      await db.query('DELETE FROM applications;');
    }
    applicationsStore.clear();
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

module.exports = Application;
