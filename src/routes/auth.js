const express = require('express');
const path = require('path');
const User = require('../models/User');
const { hashPassword, verifyPassword, isPasswordHash } = require('../services/password');
const { requireAuth, createSessionToken, setSessionCookie, clearSessionCookie } = require('../middlewares/auth');

const router = express.Router();
const views = path.join(__dirname, '..', 'views');

router.get('/register', (req, res) => res.sendFile(path.join(views, 'register.html')));
router.get('/login', (req, res) => res.sendFile(path.join(views, 'login.html')));

router.post('/auth/register', async (req, res, next) => {
  try {
    const { name, email, password, role, department, graduationYear } = req.body;
    if (!name || String(name).trim().length < 2 || !email || !/^\S+@\S+\.\S+$/.test(String(email))) {
      return res.status(400).send('Geçerli ad ve e-posta adresi girin.');
    }
    if (typeof password !== 'string' || password.length < 10) {
      return res.status(400).send('Şifre en az 10 karakter olmalıdır.');
    }
    const safeRole = role === 'student' ? 'student' : 'alumni';
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: await hashPassword(password),
      role: safeRole,
      department: department ? String(department).trim() : null,
      graduationYear: graduationYear ? Number(graduationYear) : null
    });
    setSessionCookie(res, createSessionToken(user));
    return res.redirect('/account');
  } catch (error) {
    if (error.message.includes('already exists')) return res.status(409).send('Bu e-posta adresi zaten kayıtlı.');
    return next(error);
  }
});

router.post('/auth/login', async (req, res, next) => {
  try {
    const user = await User.findByEmail(req.body.email);
    if (!user || !(await verifyPassword(req.body.password || '', user.password))) {
      return res.status(401).send('E-posta veya şifre hatalı.');
    }
    if (!isPasswordHash(user.password)) {
      await User.findByIdAndUpdate(user.id, { password: await hashPassword(req.body.password) });
    }
    setSessionCookie(res, createSessionToken(user));
    return res.redirect('/account');
  } catch (error) {
    return next(error);
  }
});

router.post('/auth/logout', (req, res) => {
  clearSessionCookie(res);
  res.redirect('/');
});

router.get('/auth/me', (req, res) => {
  res.json({ user: req.user ? req.user.toJSON() : null });
});

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

router.get('/account', requireAuth, (req, res) => {
  const user = req.user;
  const page = require('fs').readFileSync(path.join(views, 'account.html'), 'utf8')
    .replace(/{{USER_NAME}}/g, escapeHtml(user.name))
    .replace(/{{USER_EMAIL}}/g, escapeHtml(user.email))
    .replace(/{{USER_ROLE}}/g, escapeHtml(user.role))
    .replace(/{{USER_DEPARTMENT}}/g, escapeHtml(user.department || 'Henüz eklenmedi'))
    .replace(/{{USER_YEAR}}/g, escapeHtml(user.graduationYear || 'Belirtilmedi'))
    .replace(/{{ROLE_MESSAGE}}/g, user.role === 'student'
      ? 'Öğrenci alanın: topluluk etkinliklerini ve mezun bağlantılarını keşfet.'
      : user.role === 'alumni'
        ? 'Mezun alanın: deneyimini paylaş, bağlantılarını geliştir ve fırsatları takip et.'
        : 'Yönetici hesabın. Sistem yönetim araçlarına erişebilirsin.');
  res.send(page);
});

module.exports = router;
