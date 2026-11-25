const express = require('express');
const router = express.Router();
const AnnouncementController = require('../controllers/AnnouncementController');

/**
 * Web / MVC Announcement Routes
 * Base path: /announcements
 */

// READ ALL: List all announcements and management interface
router.get('/', AnnouncementController.index);

// CREATE: Process announcement creation form
router.post('/', AnnouncementController.create);

// READ ONE: View single announcement details
router.get('/:id', AnnouncementController.show);

// EDIT VIEW: View announcement edit form
router.get('/:id/edit', AnnouncementController.edit);

// UPDATE: Process announcement update
router.post('/:id/update', AnnouncementController.update);
router.put('/:id', AnnouncementController.update);

// DELETE: Process announcement deletion
router.post('/:id/delete', AnnouncementController.destroy);
router.delete('/:id', AnnouncementController.destroy);

module.exports = router;
