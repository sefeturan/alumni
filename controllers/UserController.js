const fs = require('fs');
const path = require('path');
const User = require('../models/User');

/**
 * Helper to safely escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * UserController
 * Traditional MVC Controller handling Web / View requests for Users.
 * Implements complete CRUD workflows directly integrated with HTML views:
 * - Read (All): GET /users
 * - Read (One): GET /users/:id
 * - Create:     POST /users
 * - Edit View:  GET /users/:id/edit
 * - Update:     POST /users/:id/update (or PUT /users/:id)
 * - Delete:     POST /users/:id/delete (or DELETE /users/:id)
 */
class UserController {
  /**
   * READ ALL (Listing): Renders src/views/users.html with all users
   * GET /users
   */
  static async index(req, res) {
    try {
      const users = await User.findAll(req.query);
      const viewPath = path.join(__dirname, '..', 'views', 'users.html');

      if (!fs.existsSync(viewPath)) {
        return res.status(500).send('View file src/views/users.html not found.');
      }

      let html = fs.readFileSync(viewPath, 'utf8');

      // Server-Side Render user rows into table
      let rowsHtml = '';
      if (users.length > 0) {
        rowsHtml = users.map(u => {
          const initials = escapeHtml((u.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase());
          const skillsHtml = (u.skills || []).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('');
          const safeId = escapeHtml(u.id);

          return `
            <tr data-user-row="true">
              <td>
                <div class="user-avatar">${initials}</div>
                <div class="user-meta">
                  <div class="user-name"><a href="/users/${safeId}" style="text-decoration:none; color:inherit;">${escapeHtml(u.name)}</a></div>
                  <div class="user-email">${escapeHtml(u.email)}</div>
                </div>
              </td>
              <td><span class="role-badge role-${escapeHtml(u.role || 'alumni')}">${escapeHtml(u.role || 'alumni')}</span></td>
              <td>${escapeHtml(u.department || '-')}${u.graduationYear ? ` ('${String(u.graduationYear).slice(-2)})` : ''}</td>
              <td>${u.company ? `<strong>${escapeHtml(u.title || '')}</strong><br><small style="color:#64748b">${escapeHtml(u.company)}</small>` : '-'}</td>
              <td><div class="skills-tags">${skillsHtml || '-'}</div></td>
              <td style="text-align: center;">
                <div class="actions-cell">
                  <a href="/users/${safeId}" class="btn-act btn-act-view" title="Profili Görüntüle">👁️ Detay</a>
                  <a href="/users/${safeId}/edit" class="btn-act btn-act-edit" title="Profili Düzenle">✏️ Düzenle</a>
                  <form action="/users/${safeId}/delete" method="POST" onsubmit="return confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?');" style="display:inline; margin:0;">
                    <button type="submit" class="btn-act btn-act-del" title="Kullanıcıyı Sil">🗑️ Sil</button>
                  </form>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      } else {
        rowsHtml = `
          <tr>
            <td colspan="6">
              <div class="empty-state">
                <p>Henüz kayıtlı kullanıcı bulunmuyor. Sol taraftaki formu kullanarak ilk kullanıcıyı ekleyebilirsiniz.</p>
              </div>
            </td>
          </tr>
        `;
      }

      html = html.replace('<!-- TEMPLATE_USERS_PLACEHOLDER -->', rowsHtml);
      html = html.replace('<span class="badge-count" id="userCount">0</span>', `<span class="badge-count" id="userCount">${users.length}</span>`);

      return res.status(200).send(html);
    } catch (error) {
      return res.status(500).send(`Error retrieving users: ${error.message}`);
    }
  }

  /**
   * READ ONE (Detail View): Renders src/views/user-detail.html for a single user
   * GET /users/:id
   */
  static async show(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="tr">
          <head><meta charset="UTF-8"><title>Kullanıcı Bulunamadı</title><style>body{font-family:sans-serif;padding:3rem;text-align:center;}a{color:#2563eb;}</style></head>
          <body>
            <h1>404 - Kullanıcı Bulunamadı</h1>
            <p>"${escapeHtml(id)}" kimlikli kullanıcı mevcut değil.</p>
            <p><a href="/users">← Kullanıcılar Listesine Dön</a></p>
          </body>
          </html>
        `);
      }

      const viewPath = path.join(__dirname, '..', 'views', 'user-detail.html');
      let html = fs.readFileSync(viewPath, 'utf8');

      const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      const skillsHtml = (user.skills || []).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('');

      html = html
        .replace(/{{USER_ID}}/g, escapeHtml(user.id))
        .replace(/{{USER_NAME}}/g, escapeHtml(user.name))
        .replace(/{{USER_EMAIL}}/g, escapeHtml(user.email))
        .replace(/{{USER_ROLE}}/g, escapeHtml(user.role || 'alumni'))
        .replace(/{{USER_INITIALS}}/g, escapeHtml(initials))
        .replace(/{{USER_DEPARTMENT}}/g, escapeHtml(user.department || 'Belirtilmedi'))
        .replace(/{{USER_GRADUATION_YEAR}}/g, escapeHtml(user.graduationYear ? String(user.graduationYear) : 'Belirtilmedi'))
        .replace(/{{USER_COMPANY}}/g, escapeHtml(user.company || 'Belirtilmedi'))
        .replace(/{{USER_TITLE}}/g, escapeHtml(user.title || 'Belirtilmedi'))
        .replace(/{{USER_SKILLS}}/g, skillsHtml || '<span style="color:#94a3b8">Belirtilmedi</span>')
        .replace(/{{USER_BIO}}/g, escapeHtml(user.bio || 'Henüz biyografi eklenmedi.'));

      return res.status(200).send(html);
    } catch (error) {
      return res.status(500).send(`Error retrieving user detail view: ${error.message}`);
    }
  }

  /**
   * EDIT VIEW: Renders src/views/user-edit.html with pre-filled user data
   * GET /users/:id/edit
   */
  static async edit(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).send('Kullanıcı bulunamadı.');
      }

      const viewPath = path.join(__dirname, '..', 'views', 'user-edit.html');
      let html = fs.readFileSync(viewPath, 'utf8');

      const roles = ['alumni', 'student', 'admin'];
      const roleOptionsHtml = roles.map(r => {
        const isSelected = (user.role === r) ? 'selected' : '';
        const label = r === 'alumni' ? 'Mezun (Alumni)' : r === 'student' ? 'Öğrenci (Student)' : 'Yönetici (Admin)';
        return `<option value="${r}" ${isSelected}>${label}</option>`;
      }).join('');

      html = html
        .replace(/{{USER_ID}}/g, escapeHtml(user.id))
        .replace(/{{USER_NAME}}/g, escapeHtml(user.name))
        .replace(/{{USER_EMAIL}}/g, escapeHtml(user.email))
        .replace(/{{ROLE_OPTIONS}}/g, roleOptionsHtml)
        .replace(/{{USER_GRADUATION_YEAR}}/g, escapeHtml(user.graduationYear ? String(user.graduationYear) : ''))
        .replace(/{{USER_DEPARTMENT}}/g, escapeHtml(user.department || ''))
        .replace(/{{USER_COMPANY}}/g, escapeHtml(user.company || ''))
        .replace(/{{USER_TITLE}}/g, escapeHtml(user.title || ''))
        .replace(/{{USER_SKILLS}}/g, escapeHtml((user.skills || []).join(', ')))
        .replace(/{{USER_BIO}}/g, escapeHtml(user.bio || ''));

      return res.status(200).send(html);
    } catch (error) {
      return res.status(500).send(`Error loading edit view: ${error.message}`);
    }
  }

  /**
   * CREATE: Process form submission to create a user and redirect to listing
   * POST /users
   */
  static async create(req, res) {
    try {
      const { name, email, password, role, graduationYear, department, company, title, skills, bio } = req.body;

      await User.create({
        name,
        email,
        password,
        role: role || 'alumni',
        graduationYear: graduationYear ? Number(graduationYear) : null,
        department: department || null,
        company: company || null,
        title: title || null,
        skills: typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : skills,
        bio: bio || ''
      });

      return res.redirect('/users');
    } catch (error) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head><meta charset="UTF-8"><title>Kayıt Hatası</title><style>body{font-family:sans-serif;padding:3rem;text-align:center;background:#f8fafc;}div{background:#fff;max-width:500px;margin:auto;padding:2rem;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.05);}h2{color:#ef4444;}a{color:#2563eb;font-weight:600;}</style></head>
        <body>
          <div>
            <h2>Kullanıcı Eklenemedi</h2>
            <p>${escapeHtml(error.message)}</p>
            <p><a href="javascript:history.back()">← Forma Geri Dön</a></p>
          </div>
        </body>
        </html>
      `);
    }
  }

  /**
   * UPDATE: Process user edit form submission and redirect to user detail
   * POST /users/:id/update or PUT /users/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (typeof updateData.skills === 'string') {
        updateData.skills = updateData.skills.split(',').map(s => s.trim()).filter(Boolean);
      }

      const updatedUser = await User.findByIdAndUpdate(id, updateData);

      if (!updatedUser) {
        return res.status(404).send('Güncellenecek kullanıcı bulunamadı.');
      }

      return res.redirect(`/users/${id}`);
    } catch (error) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head><meta charset="UTF-8"><title>Güncelleme Hatası</title><style>body{font-family:sans-serif;padding:3rem;text-align:center;background:#f8fafc;}div{background:#fff;max-width:500px;margin:auto;padding:2rem;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.05);}h2{color:#ef4444;}a{color:#2563eb;}</style></head>
        <body>
          <div>
            <h2>Güncelleme Başarısız</h2>
            <p>${escapeHtml(error.message)}</p>
            <p><a href="javascript:history.back()">← Geri Dön</a></p>
          </div>
        </body>
        </html>
      `);
    }
  }

  /**
   * DELETE: Process user deletion and redirect to user list
   * POST /users/:id/delete or DELETE /users/:id
   */
  static async destroy(req, res) {
    try {
      const { id } = req.params;
      const deletedUser = await User.findByIdAndDelete(id);

      if (!deletedUser) {
        return res.status(404).send('Silinecek kullanıcı bulunamadı.');
      }

      return res.redirect('/users');
    } catch (error) {
      return res.status(500).send(`Kullanıcı silinemedi: ${escapeHtml(error.message)}`);
    }
  }
}

module.exports = UserController;
