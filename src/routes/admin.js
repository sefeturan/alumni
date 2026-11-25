const express = require('express');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { requireRole } = require('../middlewares/auth');
const router = express.Router();

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

router.use(requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const users = await User.findAll();
    const rows = users.map(user => `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td><span class="role-badge">${escapeHtml(user.role)}</span></td><td><form method="POST" action="/admin/users/${encodeURIComponent(user.id)}/role" class="role-form"><select name="role" aria-label="Yeni rol"><option value="student" ${user.role === 'student' ? 'selected' : ''}>Öğrenci</option><option value="alumni" ${user.role === 'alumni' ? 'selected' : ''}>Mezun</option><option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option></select><button type="submit">Rolü kaydet</button></form></td></tr>`).join('');
    const page = fs.readFileSync(path.join(__dirname, '..', 'views', 'admin.html'), 'utf8')
      .replace('{{USER_COUNT}}', String(users.length))
      .replace('<!-- ADMIN_USER_ROWS -->', rows || '<tr><td colspan="4">Henüz kullanıcı yok.</td></tr>');
    res.send(page);
  } catch (error) { next(error); }
});

router.post('/users/:id/role', async (req, res, next) => {
  try {
    const role = String(req.body.role || '');
    if (!['student', 'alumni', 'admin'].includes(role)) return res.status(400).send('Geçersiz rol.');
    if (req.params.id === String(req.user.id) && role !== 'admin') {
      return res.status(400).send('Kendi admin rolünüzü bu ekrandan kaldıramazsınız.');
    }
    const updated = await User.findByIdAndUpdate(req.params.id, { role });
    if (!updated) return res.status(404).send('Kullanıcı bulunamadı.');
    res.redirect('/admin');
  } catch (error) { next(error); }
});

module.exports = router;
