const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../config/db');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, 'announcements.json');

/**
 * Ensures data directory exists on the filesystem.
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Local cache for announcements synchronized with persistent storage.
 */
const announcementsStore = new Map();

function loadSync() {
  try {
    ensureDataDir();
    if (fs.existsSync(ANNOUNCEMENTS_FILE)) {
      const raw = fs.readFileSync(ANNOUNCEMENTS_FILE, 'utf-8');
      if (raw.trim()) {
        const arr = JSON.parse(raw);
        announcementsStore.clear();
        for (const item of arr) {
          announcementsStore.set(item.id, new Announcement(item));
        }
      }
    } else {
      fs.writeFileSync(ANNOUNCEMENTS_FILE, '[]', 'utf-8');
    }
  } catch (err) {
    console.error('Failed to load announcements from file storage:', err.message);
  }
}

async function persistFile() {
  try {
    ensureDataDir();
    const data = Array.from(announcementsStore.values()).map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      author: announcement.author,
      priority: announcement.priority,
      tags: announcement.tags,
      isActive: announcement.isActive,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt
    }));
    await fs.promises.writeFile(ANNOUNCEMENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist announcements to file storage:', err.message);
  }
}

/**
 * Maps a PostgreSQL row (snake_case) to an Announcement instance (camelCase).
 */
function mapRowToAnnouncement(row) {
  if (!row) return null;
  return new Announcement({
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    author: row.author,
    priority: row.priority,
    tags: row.tags || [],
    isActive: row.is_active,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  });
}

/**
 * Announcement Model
 * Represents platform announcements with PostgreSQL & file storage support.
 */
class Announcement {
  constructor({
    id,
    title,
    content,
    category = 'general',
    author = 'Alumni Network Yönetimi',
    priority = 'medium',
    tags = [],
    isActive = true,
    createdAt,
    updatedAt
  }) {
    this.id = id || crypto.randomUUID();
    this.title = title ? String(title).trim() : '';
    this.content = content ? String(content).trim() : '';
    this.category = category; // 'general' | 'academic' | 'career' | 'event'
    this.author = author ? String(author).trim() : 'Alumni Network Yönetimi';
    this.priority = priority; // 'low' | 'medium' | 'high' | 'urgent'
    this.tags = Array.isArray(tags) ? tags : [];
    this.isActive = typeof isActive === 'boolean' ? isActive : true;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }

  // ==========================================
  // CRUD OPERATIONS WITH DATABASE CONNECTION
  // ==========================================

  /**
   * CREATE: Inserts a new announcement into PostgreSQL or storage.
   */
  static async create(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Duyuru verisi gereklidir.');
    }
    if (!data.title || !data.content) {
      throw new Error('Duyuru başlığı ve içeriği zorunlu alanlardır.');
    }

    const instance = new Announcement(data);

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = `
        INSERT INTO announcements (
          id, title, content, category, author, priority, tags, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *;
      `;
      const values = [
        instance.id,
        instance.title,
        instance.content,
        instance.category,
        instance.author,
        instance.priority,
        instance.tags,
        instance.isActive,
        instance.createdAt,
        instance.updatedAt
      ];

      const { rows } = await db.query(sql, values);
      const created = mapRowToAnnouncement(rows[0]);
      announcementsStore.set(created.id, created);
      await persistFile();
      return created;
    }

    // Fallback storage
    announcementsStore.set(instance.id, instance);
    await persistFile();
    return instance;
  }

  /**
   * READ ALL: Finds all announcements matching filter options.
   */
  static async findAll(filter = {}) {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const conditions = [];
      const values = [];

      if (filter.category) {
        values.push(filter.category);
        conditions.push(`LOWER(category) = LOWER($${values.length})`);
      }
      if (filter.priority) {
        values.push(filter.priority);
        conditions.push(`LOWER(priority) = LOWER($${values.length})`);
      }
      if (filter.author) {
        values.push(`%${filter.author}%`);
        conditions.push(`author ILIKE $${values.length}`);
      }
      if (filter.isActive !== undefined && filter.isActive !== '') {
        values.push(filter.isActive === true || filter.isActive === 'true');
        conditions.push(`is_active = $${values.length}`);
      }

      let sql = 'SELECT * FROM announcements';
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY created_at DESC';

      const { rows } = await db.query(sql, values);
      return rows.map(mapRowToAnnouncement);
    }

    // Fallback storage
    let results = Array.from(announcementsStore.values());
    const filterKeys = Object.keys(filter);
    if (filterKeys.length > 0) {
      results = results.filter((announcement) => {
        return filterKeys.every((key) => {
          if (filter[key] === undefined || filter[key] === null || filter[key] === '') return true;
          if (typeof announcement[key] === 'string' && typeof filter[key] === 'string') {
            return announcement[key].toLowerCase() === filter[key].toLowerCase();
          }
          if (key === 'isActive' && typeof filter[key] === 'string') {
            return String(announcement.isActive) === filter[key];
          }
          return announcement[key] === filter[key];
        });
      });
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * READ ONE: Retrieves an announcement by ID.
   */
  static async findById(id) {
    if (!id) return null;

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = 'SELECT * FROM announcements WHERE id = $1 LIMIT 1;';
      const { rows } = await db.query(sql, [id]);
      if (rows.length === 0) return null;
      return mapRowToAnnouncement(rows[0]);
    }

    return announcementsStore.get(String(id)) || null;
  }

  /**
   * UPDATE: Updates announcement fields in PostgreSQL or storage.
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
        content: 'content',
        category: 'category',
        author: 'author',
        priority: 'priority',
        tags: 'tags',
        isActive: 'is_active'
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
        UPDATE announcements
        SET ${updates.join(', ')}
        WHERE id = $${values.length}
        RETURNING *;
      `;

      const { rows } = await db.query(sql, values);
      const updated = mapRowToAnnouncement(rows[0]);
      announcementsStore.set(updated.id, updated);
      await persistFile();
      return updated;
    }

    // Fallback storage
    const announcement = await this.findById(id);
    if (!announcement) return null;

    const updatableFields = ['title', 'content', 'category', 'author', 'priority', 'tags', 'isActive'];
    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        if (field === 'tags' && Array.isArray(updateData.tags)) {
          announcement.tags = updateData.tags;
        } else if (field === 'isActive') {
          announcement.isActive = updateData.isActive === true || updateData.isActive === 'true';
        } else {
          announcement[field] = updateData[field];
        }
      }
    }

    announcement.updatedAt = new Date().toISOString();
    announcementsStore.set(announcement.id, announcement);
    await persistFile();
    return announcement;
  }

  /**
   * DELETE: Deletes an announcement by ID from PostgreSQL or storage.
   */
  static async findByIdAndDelete(id) {
    if (!id) return null;

    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const sql = 'DELETE FROM announcements WHERE id = $1 RETURNING *;';
      const { rows } = await db.query(sql, [id]);
      if (rows.length === 0) return null;
      announcementsStore.delete(id);
      await persistFile();
      return mapRowToAnnouncement(rows[0]);
    }

    const announcement = await this.findById(id);
    if (!announcement) return null;

    announcementsStore.delete(announcement.id);
    await persistFile();
    return announcement;
  }

  /**
   * UTILITY: Returns total number of announcements.
   */
  static async count() {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM announcements;');
      return rows[0].count;
    }
    return announcementsStore.size;
  }

  /**
   * UTILITY: Clears all announcements.
   */
  static async clear() {
    const isConnected = await db.isDbAvailable();
    if (isConnected) {
      await db.query('DELETE FROM announcements;');
    }
    announcementsStore.clear();
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

module.exports = Announcement;
