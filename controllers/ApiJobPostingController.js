const JobPosting = require('../models/JobPosting');
const User = require('../models/User');

/**
 * ApiJobPostingController
 * Handles RESTful API requests for direct and nested JobPosting operations.
 */
class ApiJobPostingController {
  // ==========================================
  // DIRECT ROUTES HANDLERS (/api/jobs)
  // ==========================================

  /**
   * READ ALL: Get all job postings with optional query filtering
   * GET /api/jobs
   */
  static async getAllJobs(req, res) {
    try {
      const filter = { ...req.query };
      const jobs = await JobPosting.findAll(filter);

      return res.status(200).json({
        success: true,
        count: jobs.length,
        data: jobs
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'İş ilanları alınamadı.',
        error: error.message
      });
    }
  }

  /**
   * READ ONE: Get a single job posting by ID
   * GET /api/jobs/:id
   */
  static async getJobById(req, res) {
    try {
      const { id } = req.params;
      const job = await JobPosting.findById(id);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: `ID "${id}" ile eşleşen iş ilanı bulunamadı.`
        });
      }

      return res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'İş ilanı getirilemedi.',
        error: error.message
      });
    }
  }

  /**
   * CREATE: Create a new job posting directly
   * POST /api/jobs
   */
  static async createJob(req, res) {
    try {
      const { userId, title, company, location, description } = req.body;

      if (!userId || !title || !company || !description) {
        return res.status(400).json({
          success: false,
          message: 'userId, title, company ve description alanları zorunludur.'
        });
      }

      // Check user existence
      const author = await User.findById(userId);
      if (!author) {
        return res.status(404).json({
          success: false,
          message: `Geçersiz userId: "${userId}" ID'li kullanıcı sistemde kayıtlı değil.`
        });
      }

      const newJob = await JobPosting.create(req.body);

      return res.status(201).json({
        success: true,
        message: 'İş ilanı başarıyla oluşturuldu.',
        data: newJob
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'İş ilanı oluşturulamadı.',
        error: error.message
      });
    }
  }

  /**
   * UPDATE: Update a job posting by ID
   * PUT /api/jobs/:id, PATCH /api/jobs/:id
   */
  static async updateJob(req, res) {
    try {
      const { id } = req.params;
      const existing = await JobPosting.findById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `ID "${id}" ile eşleşen iş ilanı bulunamadı.`
        });
      }

      const updated = await JobPosting.findByIdAndUpdate(id, req.body);

      return res.status(200).json({
        success: true,
        message: 'İş ilanı başarıyla güncellendi.',
        data: updated
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'İş ilanı güncellenemedi.',
        error: error.message
      });
    }
  }

  /**
   * DELETE: Delete a job posting by ID
   * DELETE /api/jobs/:id
   */
  static async deleteJob(req, res) {
    try {
      const { id } = req.params;
      const deleted = await JobPosting.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: `ID "${id}" ile eşleşen iş ilanı bulunamadı.`
        });
      }

      return res.status(200).json({
        success: true,
        message: 'İş ilanı başarıyla silindi.',
        data: deleted
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'İş ilanı silinemedi.',
        error: error.message
      });
    }
  }

  // ==========================================
  // NESTED ROUTES HANDLERS (/api/users/:userId/jobs)
  // ==========================================

  /**
   * NESTED READ ALL: Get all job postings authored by a specific user
   * GET /api/users/:userId/jobs
   */
  static async getUserJobs(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `ID "${userId}" ile eşleşen kullanıcı bulunamadı.`
        });
      }

      const userJobs = await user.getJobPostings();

      return res.status(200).json({
        success: true,
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.company,
          title: user.title
        },
        count: userJobs.length,
        data: userJobs
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Kullanıcıya ait iş ilanları alınamadı.',
        error: error.message
      });
    }
  }

  /**
   * NESTED CREATE: Create a new job posting under a specific user
   * POST /api/users/:userId/jobs
   */
  static async createUserJob(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `ID "${userId}" ile eşleşen kullanıcı bulunamadı.`
        });
      }

      const { title, company, description } = req.body;
      if (!title || !company || !description) {
        return res.status(400).json({
          success: false,
          message: 'title, company ve description alanları zorunludur.'
        });
      }

      const jobData = {
        ...req.body,
        userId: user.id
      };

      const newJob = await JobPosting.create(jobData);

      return res.status(201).json({
        success: true,
        message: `"${user.name}" adına yeni iş ilanı oluşturuldu.`,
        data: newJob
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcıya ait iş ilanı oluşturulamadı.',
        error: error.message
      });
    }
  }

  /**
   * NESTED READ ONE: Get a specific job posting under a specific user
   * GET /api/users/:userId/jobs/:jobId
   */
  static async getUserJobById(req, res) {
    try {
      const { userId, jobId } = req.params;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `ID "${userId}" ile eşleşen kullanıcı bulunamadı.`
        });
      }

      const job = await JobPosting.findById(jobId);
      if (!job || job.userId !== userId) {
        return res.status(404).json({
          success: false,
          message: `Bu kullanıcıya ait ID "${jobId}" olan bir iş ilanı bulunamadı.`
        });
      }

      return res.status(200).json({
        success: true,
        data: job
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'İş ilanı getirilemedi.',
        error: error.message
      });
    }
  }

  /**
   * NESTED DELETE: Delete a specific job posting under a specific user
   * DELETE /api/users/:userId/jobs/:jobId
   */
  static async deleteUserJob(req, res) {
    try {
      const { userId, jobId } = req.params;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `ID "${userId}" ile eşleşen kullanıcı bulunamadı.`
        });
      }

      const job = await JobPosting.findById(jobId);
      if (!job || job.userId !== userId) {
        return res.status(404).json({
          success: false,
          message: `Bu kullanıcıya ait ID "${jobId}" olan bir iş ilanı bulunamadı.`
        });
      }

      const deleted = await JobPosting.findByIdAndDelete(jobId);

      return res.status(200).json({
        success: true,
        message: 'İş ilanı başarıyla silindi.',
        data: deleted
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'İş ilanı silinemedi.',
        error: error.message
      });
    }
  }
}

module.exports = ApiJobPostingController;
