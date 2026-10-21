const Application = require('../models/Application');
const JobPosting = require('../models/JobPosting');
const User = require('../models/User');

/**
 * ApiApplicationController
 * Handles direct and nested RESTful API requests for Application operations.
 */
class ApiApplicationController {
  // ==========================================
  // DIRECT ROUTES HANDLERS (/api/applications)
  // ==========================================

  /**
   * READ ALL: Get all applications with optional query filtering
   * GET /api/applications
   */
  static async getAllApplications(req, res) {
    try {
      const filter = { ...req.query };
      const applications = await Application.findAll(filter);

      return res.status(200).json({
        success: true,
        count: applications.length,
        data: applications
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Başvurular alınamadı.',
        error: error.message
      });
    }
  }

  /**
   * READ ONE: Get a single application by ID
   * GET /api/applications/:id
   */
  static async getApplicationById(req, res) {
    try {
      const { id } = req.params;
      const application = await Application.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: `ID "${id}" ile eşleşen başvuru bulunamadı.`
        });
      }

      return res.status(200).json({
        success: true,
        data: application
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Başvuru getirilemedi.',
        error: error.message
      });
    }
  }

  /**
   * CREATE: Create a new application directly
   * POST /api/applications
   */
  static async createApplication(req, res) {
    try {
      const { jobId, userId, resumeUrl, coverLetter, notes } = req.body;

      if (!jobId || !userId) {
        return res.status(400).json({
          success: false,
          message: 'jobId ve userId alanları zorunludur.'
        });
      }

      // Check job exists
      const job = await JobPosting.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: `Geçersiz jobId: "${jobId}" ID'li iş ilanı bulunamadı.`
        });
      }

      // Check user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `Geçersiz userId: "${userId}" ID'li kullanıcı bulunamadı.`
        });
      }

      // Check uniqueness
      const existing = await Application.findByJobAndUser(jobId, userId);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Bu kullanıcı bu ilana zaten başvuruda bulunmuş.'
        });
      }

      const newApplication = await Application.create(req.body);

      return res.status(201).json({
        success: true,
        message: 'Başvuru başarıyla oluşturuldu.',
        data: newApplication
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Başvuru oluşturulamadı.',
        error: error.message
      });
    }
  }

  /**
   * UPDATE: Update application status or notes
   * PUT /api/applications/:id, PATCH /api/applications/:id
   */
  static async updateApplication(req, res) {
    try {
      const { id } = req.params;
      const existing = await Application.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `ID "${id}" ile eşleşen başvuru bulunamadı.`
        });
      }

      const updated = await Application.findByIdAndUpdate(id, req.body);

      return res.status(200).json({
        success: true,
        message: 'Başvuru başarıyla güncellendi.',
        data: updated
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Başvuru güncellenemedi.',
        error: error.message
      });
    }
  }

  /**
   * DELETE: Delete/withdraw an application
   * DELETE /api/applications/:id
   */
  static async deleteApplication(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Application.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `ID "${id}" ile eşleşen başvuru bulunamadı.`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Başvuru başarıyla silindi.',
        data: deleted
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Başvuru silinemedi.',
        error: error.message
      });
    }
  }

  // ==========================================
  // NESTED JOB ROUTES HANDLERS (/api/jobs/:jobId/applications)
  // ==========================================

  /**
   * NESTED JOB READ: Get all applications for a specific job
   * GET /api/jobs/:jobId/applications
   */
  static async getJobApplications(req, res) {
    try {
      const { jobId } = req.params;
      const job = await JobPosting.findById(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: `ID "${jobId}" ile eşleşen iş ilanı bulunamadı.`
        });
      }

      const applications = await job.getApplications();

      return res.status(200).json({
        success: true,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        count: applications.length,
        data: applications
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'İlana ait başvurular getirilemedi.',
        error: error.message
      });
    }
  }

  /**
   * NESTED JOB APPLY: Submit an application to a specific job
   * POST /api/jobs/:jobId/applications
   */
  static async applyToJob(req, res) {
    try {
      const { jobId } = req.params;
      const { userId, resumeUrl, coverLetter } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Başvuru yapan kullanıcı ID (userId) alanı zorunludur.'
        });
      }

      const job = await JobPosting.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: `ID "${jobId}" ile eşleşen iş ilanı bulunamadı.`
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `ID "${userId}" ile eşleşen kullanıcı bulunamadı.`
        });
      }

      const existing = await Application.findByJobAndUser(jobId, userId);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Bu ilana zaten daha önce başvuruda bulundunuz.'
        });
      }

      const newApp = await Application.create({
        jobId: job.id,
        userId: user.id,
        resumeUrl,
        coverLetter,
        status: 'pending'
      });

      return res.status(201).json({
        success: true,
        message: `"${job.title}" pozisyonuna başvurunuz başarıyla alındı.`,
        data: newApp
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'İlana başvuru yapılamadı.',
        error: error.message
      });
    }
  }

  // ==========================================
  // NESTED USER ROUTES HANDLERS (/api/users/:userId/applications)
  // ==========================================

  /**
   * NESTED USER READ: Get all applications submitted by a user
   * GET /api/users/:userId/applications
   */
  static async getUserApplications(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `ID "${userId}" ile eşleşen kullanıcı bulunamadı.`
        });
      }

      const applications = await user.getApplications();

      return res.status(200).json({
        success: true,
        userId: user.id,
        userName: user.name,
        count: applications.length,
        data: applications
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Kullanıcının başvuruları getirilemedi.',
        error: error.message
      });
    }
  }
}

module.exports = ApiApplicationController;
