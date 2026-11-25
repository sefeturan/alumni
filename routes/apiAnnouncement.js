const express = require('express');
const router = express.Router();
const ApiAnnouncementController = require('../controllers/ApiAnnouncementController');

/**
 * RESTful API Announcement Routes
 * Base path: /api/announcements
 */

// GET /api/announcements - Get all announcements (supports query filters)
router.get('/', ApiAnnouncementController.getAllAnnouncements);

// POST /api/announcements - Create a new announcement
router.post('/', ApiAnnouncementController.createAnnouncement);

// GET /api/announcements/:id - Get single announcement by ID
router.get('/:id', ApiAnnouncementController.getAnnouncementById);

// PUT /api/announcements/:id - Full update of an announcement
router.put('/:id', ApiAnnouncementController.updateAnnouncement);

// PATCH /api/announcements/:id - Partial update of an announcement
router.patch('/:id', ApiAnnouncementController.updateAnnouncement);

// DELETE /api/announcements/:id - Delete an announcement
router.delete('/:id', ApiAnnouncementController.deleteAnnouncement);

module.exports = router;
