const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/db');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const JOB_POSTINGS_FILE = path.join(DATA_DIR, 'job_postings.json');

/**
 * Ensures data directory exists on the filesystem.
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Local cache for job postings synchronized with persistent file storage.
 */
const jobPostingsStore = new Map();

function loadSync() {
  try {
    ensureDataDir();
    if (fs.existsSync(JOB_POSTINGS_FILE)) {
      const raw = fs.readFileSync(JOB_POSTINGS_FILE, 'utf-8');
      if (raw.trim()) {
        const arr = JSON.parse(raw);
        jobPostingsStore.clear();
        for (const item of arr) {
          jobPostingsStore.set(item.id, new JobPosting(item));
        }
      }
    } else {
      fs.writeFileSync(JOB_POSTINGS_FILE, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('Failed to load job postings from file storage:', err.message);
  }
}

async function persistFile() {
  try {
    ensureDataDir();
    const data = Array.from(jobPostingsStore.values()).map(job => ({
      id: job.id,
      userId: job.userId,
      title: job.title,
      company: job.company,
      location: job.location,
      workType: job.workType,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      description: job.description,
      requirements: job.requirements,
      salaryRange: job.salaryRange,
      applicationUrl: job.applicationUrl,
      isActive: job.isActive,
      deadline: job.deadline,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    }));
    await fs.promises.writeFile(JOB_POSTINGS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist job postings to file storage:', err.message);
  }
}

/**
 * Maps a PostgreSQL row (snake_case) to a JobPosting instance (camelCase).
 */
function mapRowToJobPosting(row) {
  if (!row) return null;
  const instance = new JobPosting({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    company: row.company,
    location: row.location,
    workType: row.work_type,
    employmentType: row.employment_type,
    experienceLevel: row.experience_level,
    description: row.description,
    requirements: row.requirements || [],
    salaryRange: row.salary_range,
    applicationUrl: row.application_url,
    isActive: row.is_active,
    deadline: row.deadline ? (row.deadline instanceof Date ? row.deadline.toISOString() : row.deadline) : null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  });

  if (row.author && typeof row.author === 'object' && row.author.id) {
    instance.user = row.author;
  }

  return instance;
}

/**
 * JobPosting Model
 * Represents career and internship opportunities with PostgreSQL & file storage support.
 */
class JobPosting {
  constructor({
    id,
    userId,
    title,
    company,
    location,
    workType = 'hybrid',
    employmentType = 'full-time',
    experienceLevel = 'mid',
    description,
    requirements = [],
    salaryRange = null,
    applicationUrl = null,
    isActive = true,
    deadline = null,
    createdAt,
    updatedAt,
    user = null
  }) {
    this.id = id || crypto.randomUUID();
    this.userId = userId;
    this.title = title ? String(title).trim() : '';
    this.company = company ? String(company).trim() : '';
    this.location = location ? String(location).trim() : '';
    this.workType = workType; // 'remote' | 'hybrid' | 'on-site'
    this.employmentType = employmentType; // 'full-time' | 'part-time' | 'internship' | 'contract'
    this.experienceLevel = experienceLevel; // 'intern' | 'entry' | 'mid' | 'senior' | 'lead'
    this.description = description ? String(description).trim() : '';
    this.requirements = Array.isArray(requirements) ? requirements : [];
    this.salaryRange = salaryRange || null;
    this.applicationUrl = applicationUrl || null;
    this.isActive = typeof isActive === 'boolean' ? isActive : true;
    this.deadline = deadline || null;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
    if (user) {
      this.user = user;
    }
  }

  // ==========================================
  // RELATIONSHIPS
  // ==========================================

  /**
   * BELONGS TO: Retrieves the User who authored/posted this job opportunity.
   * @returns {Promise<User|null>}
   */
  async getUser() {
    if (!this.userId) return null;
    const User = require('./User');
    return User.findById(this.userId);
  }

  /**
   * HAS MANY: Retrieves all Applications submitted for this job opportunity.
   * @returns {Promise<Array>}
   */
  async getApplications() {
    const Application = require('./Application');
    return Application.findByJobId(this.id);
  }

  /**
   * HAS MANY (STATIC): Retrieves all Applications for a specific job ID.
   * @param {string} jobId
   * @returns {Promise<Array>}
   */
  static async getApplications(jobId) {
    const Application = require('./Application');
    return Application.findByJobId(jobId);
  }

  // ==========================================
  // CRUD OPERATIONS WITH DATABASE CONNECTION
  // ==========================================

  /**
   * CREATE: Inserts a new job posting into PostgreSQL or persistent storage.
   */
  static async create(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('İş ilanı verisi gereklidir.');
    }
    if (!data.title || !data.company || !data.description || !data.userId) {
      throw new Error('Başlık, şirket, açıklama ve kullanıcı ID (userId) alanları zorunludur.');
    }

    const instance = new JobPosting(data);

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = `
        INSERT INTO job_postings (
          id, user_id, title, company, location, work_type, employment_type,
          experience_level, description, requirements, salary_range, application_url,
          is_active, deadline, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *;
      `;
      const values = [
        instance.id,
        instance.userId,
        instance.title,
        instance.company,
        instance.location,
        instance.workType,
        instance.employmentType,
        instance.experienceLevel,
        instance.description,
        instance.requirements,
        instance.salaryRange,
        instance.applicationUrl,
        instance.isActive,
        instance.deadline,
        instance.createdAt,
        instance.updatedAt
      ];

      const { rows } = await db.query(sql, values);
      const created = mapRowToJobPosting(rows[0]);
      jobPostingsStore.set(created.id, created);
      await persistFile();
      return created;
    }

    // Fallback storage
    jobPostingsStore.set(instance.id, instance);
    await persistFile();
    return instance;
  }

  /**
   * READ ALL: Retrieves all job postings matching filter criteria.
   */
  static async findAll(filter = {}) {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const conditions = [];
      const values = [];

      if (filter.userId) {
        values.push(filter.userId);
        conditions.push(`j.user_id = $${values.length}`);
      }
      if (filter.workType) {
        values.push(filter.workType);
        conditions.push(`j.work_type = $${values.length}`);
      }
      if (filter.employmentType) {
        values.push(filter.employmentType);
        conditions.push(`j.employment_type = $${values.length}`);
      }
      if (filter.experienceLevel) {
        values.push(filter.experienceLevel);
        conditions.push(`j.experience_level = $${values.length}`);
      }
      if (filter.company) {
        values.push(`%${filter.company}%`);
        conditions.push(`j.company ILIKE $${values.length}`);
      }
      if (filter.isActive !== undefined && filter.isActive !== '') {
        values.push(filter.isActive === true || filter.isActive === 'true');
        conditions.push(`j.is_active = $${values.length}`);
      }

      let sql = `
        SELECT j.*,
               json_build_object(
                 'id', u.id,
                 'name', u.name,
                 'email', u.email,
                 'company', u.company,
                 'title', u.title
               ) AS author
        FROM job_postings j
        LEFT JOIN users u ON j.user_id = u.id
      `;

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY j.created_at DESC';

      const { rows } = await db.query(sql, values);
      return rows.map(mapRowToJobPosting);
    }

    // Fallback storage
    let results = Array.from(jobPostingsStore.values());
    const filterKeys = Object.keys(filter);
    if (filterKeys.length > 0) {
      results = results.filter((job) => {
        return filterKeys.every((key) => {
          if (filter[key] === undefined || filter[key] === null || filter[key] === '') return true;
          if (typeof job[key] === 'string' && typeof filter[key] === 'string') {
            return job[key].toLowerCase() === filter[key].toLowerCase();
          }
          if (key === 'isActive' && typeof filter[key] === 'string') {
            return String(job.isActive) === filter[key];
          }
          return job[key] === filter[key];
        });
      });
    }

    // Populate user if available in fallback
    const User = require('./User');
    for (const job of results) {
      if (!job.user && job.userId) {
        const author = await User.findById(job.userId);
        if (author) {
          job.user = author.toJSON ? author.toJSON() : author;
        }
      }
    }

    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * READ ONE: Retrieves a single job posting by ID with optional author inclusion.
   */
  static async findById(id) {
    if (!id) return null;

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = `
        SELECT j.*,
               json_build_object(
                 'id', u.id,
                 'name', u.name,
                 'email', u.email,
                 'company', u.company,
                 'title', u.title
               ) AS author
        FROM job_postings j
        LEFT JOIN users u ON j.user_id = u.id
        WHERE j.id = $1
        LIMIT 1;
      `;
      const { rows } = await db.query(sql, [id]);
      if (rows.length === 0) return null;
      return mapRowToJobPosting(rows[0]);
    }

    const job = jobPostingsStore.get(String(id)) || null;
    if (job && !job.user && job.userId) {
      const User = require('./User');
      const author = await User.findById(job.userId);
      if (author) {
        job.user = author.toJSON ? author.toJSON() : author;
      }
    }
    return job;
  }

  /**
   * READ BY USER: Finds all job postings posted by a specific User.
   */
  static async findByUserId(userId) {
    if (!userId) return [];
    return this.findAll({ userId });
  }

  /**
   * UPDATE: Updates job posting fields in PostgreSQL or fallback storage.
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
        title: 'title',
        company: 'company',
        location: 'location',
        workType: 'work_type',
        employmentType: 'employment_type',
        experienceLevel: 'experience_level',
        description: 'description',
        requirements: 'requirements',
        salaryRange: 'salary_range',
        applicationUrl: 'application_url',
        isActive: 'is_active',
        deadline: 'deadline'
      };

      for (const [prop, column] of Object.entries(fieldMappings)) {
        if (updateData[prop] !== undefined) {
          const val = prop === 'isActive'
            ? (updateData.isActive === true || updateData.isActive === 'true')
            : updateData[prop];
          values.push(val);
          updates.push(`${column} = $${values.length}`);
        }
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const sql = `
        UPDATE job_postings
        SET ${updates.join(', ')}
        WHERE id = $${values.length}
        RETURNING *;
      `;

      const { rows } = await db.query(sql, values);
      const updated = mapRowToJobPosting(rows[0]);
      jobPostingsStore.set(updated.id, updated);
      await persistFile();
      return updated;
    }

    // Fallback storage
    const job = await this.findById(id);
    if (!job) return null;

    const updatableFields = [
      'title', 'company', 'location', 'workType', 'employmentType',
      'experienceLevel', 'description', 'requirements', 'salaryRange',
      'applicationUrl', 'isActive', 'deadline'
    ];

    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        if (field === 'requirements' && Array.isArray(updateData.requirements)) {
          job.requirements = updateData.requirements;
        } else if (field === 'isActive') {
          job.isActive = updateData.isActive === true || updateData.isActive === 'true';
        } else {
          job[field] = updateData[field];
        }
      }
    }

    job.updatedAt = new Date().toISOString();
    jobPostingsStore.set(job.id, job);
    await persistFile();
    return job;
  }

  /**
   * DELETE: Deletes a job posting by ID.
   */
  static async findByIdAndDelete(id) {
    if (!id) return null;

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = 'DELETE FROM job_postings WHERE id = $1 RETURNING *;';
      const { rows } = await db.query(sql, [id]);
      if (rows.length === 0) return null;
      jobPostingsStore.delete(id);
      await persistFile();
      return mapRowToJobPosting(rows[0]);
    }

    const job = await this.findById(id);
    if (!job) return null;

    jobPostingsStore.delete(job.id);
    await persistFile();
    return job;
  }

  /**
   * UTILITY: Returns total number of job postings.
   */
  static async count(filter = {}) {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      let sql = 'SELECT COUNT(*)::int AS count FROM job_postings';
      const values = [];
      if (filter.userId) {
        values.push(filter.userId);
        sql += ' WHERE user_id = $1';
      }
      const { rows } = await db.query(sql, values);
      return rows[0].count;
    }
    if (filter.userId) {
      return (await this.findByUserId(filter.userId)).length;
    }
    return jobPostingsStore.size;
  }

  /**
   * UTILITY: Clears all job postings.
   */
  static async clear() {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      await db.query('DELETE FROM job_postings;');
    }
    jobPostingsStore.clear();
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

module.exports = JobPosting;
