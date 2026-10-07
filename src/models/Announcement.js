const crypto = require('crypto');

/**
 * In-memory storage for announcements without requiring an external database connection.
 * Maps unique announcement IDs to Announcement instances.
 */
const announcementsStore = new Map();

/**
 * Announcement Model
 * Represents platform announcements, news, and notifications with full in-memory CRUD operations.
 */
class Announcement {
  /**
   * @param {Object} data - Announcement data
   */
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
  // CRUD OPERATIONS
  // ==========================================

  /**
   * CREATE: Create and persist a new announcement in memory.
   * @param {Object} data - Announcement fields
   * @returns {Promise<Announcement>} Newly created Announcement instance
   */
  static async create(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Duyuru verisi gereklidir.');
    }

    if (!data.title || !data.content) {
      throw new Error('Duyuru başlığı ve içeriği zorunlu alanlardır.');
    }

    const newAnnouncement = new Announcement(data);
    announcementsStore.set(newAnnouncement.id, newAnnouncement);
    return newAnnouncement;
  }

  /**
   * READ ALL: Find all announcements, optionally filtered by matching properties.
   * @param {Object} [filter={}] - Filter criteria (e.g. { category: 'event', priority: 'high' })
   * @returns {Promise<Announcement[]>} Array of Announcement instances sorted by creation date (newest first)
   */
  static async findAll(filter = {}) {
    let results = Array.from(announcementsStore.values());

    const filterKeys = Object.keys(filter);
    if (filterKeys.length > 0) {
      results = results.filter((announcement) => {
        return filterKeys.every((key) => {
          if (filter[key] === undefined || filter[key] === null || filter[key] === '') return true;
          // Case-insensitive comparison for strings
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

    // Sort newest first
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * READ ONE: Find an announcement by unique ID.
   * @param {string} id - Announcement ID
   * @returns {Promise<Announcement|null>} Announcement instance or null if not found
   */
  static async findById(id) {
    if (!id) return null;
    return announcementsStore.get(String(id)) || null;
  }

  /**
   * UPDATE: Find an announcement by ID and update its properties.
   * @param {string} id - Announcement ID to update
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Announcement|null>} Updated Announcement instance or null if not found
   */
  static async findByIdAndUpdate(id, updateData) {
    const announcement = await this.findById(id);
    if (!announcement) {
      return null;
    }

    if (!updateData || typeof updateData !== 'object') {
      return announcement;
    }

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

    return announcement;
  }

  /**
   * DELETE: Find an announcement by ID and remove it from memory.
   * @param {string} id - Announcement ID to delete
   * @returns {Promise<Announcement|null>} The deleted Announcement instance or null if not found
   */
  static async findByIdAndDelete(id) {
    const announcement = await this.findById(id);
    if (!announcement) {
      return null;
    }

    announcementsStore.delete(announcement.id);
    return announcement;
  }

  /**
   * UTILITY: Return the total count of announcements.
   * @returns {Promise<number>}
   */
  static async count() {
    return announcementsStore.size;
  }

  /**
   * UTILITY: Clear all announcements from memory (useful for testing).
   * @returns {Promise<void>}
   */
  static async clear() {
    announcementsStore.clear();
  }
}

module.exports = Announcement;
