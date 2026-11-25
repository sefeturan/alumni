const Announcement = require('../models/Announcement');

/**
 * ApiAnnouncementController
 * Handles RESTful JSON API operations for Announcements.
 * Returns standard JSON responses with status codes.
 */
class ApiAnnouncementController {
  /**
   * READ ALL: Get all announcements (supports filters: category, priority, isActive)
   * GET /api/announcements
   */
  static async getAllAnnouncements(req, res) {
    try {
      const filter = { ...req.query };
      const announcements = await Announcement.findAll(filter);

      return res.status(200).json({
        success: true,
        count: announcements.length,
        data: announcements
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Duyurular getirilemedi.',
        error: error.message
      });
    }
  }

  /**
   * READ ONE: Get a single announcement by ID
   * GET /api/announcements/:id
   */
  static async getAnnouncementById(req, res) {
    try {
      const { id } = req.params;
      const announcement = await Announcement.findById(id);

      if (!announcement) {
        return res.status(404).json({
          success: false,
          message: `ID "${id}" olan duyuru bulunamadı.`
        });
      }

      return res.status(200).json({
        success: true,
        data: announcement
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Duyuru getirilemedi.',
        error: error.message
      });
    }
  }

  /**
   * CREATE: Create a new announcement
   * POST /api/announcements
   */
  static async createAnnouncement(req, res) {
    try {
      const { title, content, category, author, priority, tags, isActive } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Duyuru başlığı ve içeriği zorunlu alanlardır.'
        });
      }

      const newAnnouncement = await Announcement.create({
        title,
        content,
        category,
        author,
        priority,
        tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
        isActive
      });

      return res.status(201).json({
        success: true,
        message: 'Duyuru başarıyla oluşturuldu.',
        data: newAnnouncement
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * UPDATE: Update an existing announcement by ID
   * PUT /api/announcements/:id or PATCH /api/announcements/:id
   */
  static async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const existing = await Announcement.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `ID "${id}" olan duyuru bulunamadı.`
        });
      }

      const updateData = { ...req.body };
      if (typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      const updated = await Announcement.findByIdAndUpdate(id, updateData);

      return res.status(200).json({
        success: true,
        message: 'Duyuru başarıyla güncellendi.',
        data: updated
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE: Delete an announcement by ID
   * DELETE /api/announcements/:id
   */
  static async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Announcement.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `ID "${id}" olan duyuru bulunamadı.`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Duyuru başarıyla silindi.',
        data: deleted
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Duyuru silinemedi.',
        error: error.message
      });
    }
  }
}

module.exports = ApiAnnouncementController;
