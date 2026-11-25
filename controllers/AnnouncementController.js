const fs = require('fs');
const path = require('path');
const Announcement = require('../models/Announcement');

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
 * AnnouncementController
 * Traditional MVC Controller for Web Views & Interface Management.
 * Implements complete CRUD workflows with HTML templates.
 */
class AnnouncementController {
  /**
   * READ ALL: Management interface and list view
   * GET /announcements
   */
  static async index(req, res) {
    try {
      const announcements = await Announcement.findAll(req.query);
      const viewPath = path.join(__dirname, '..', 'views', 'announcements.html');

      if (!fs.existsSync(viewPath)) {
        return res.status(500).send('View file src/views/announcements.html not found.');
      }

      let html = fs.readFileSync(viewPath, 'utf8');

      // Server-Side Render announcement rows into table
      let rowsHtml = '';
      if (announcements.length > 0) {
        rowsHtml = announcements.map(a => {
          const safeId = escapeHtml(a.id);
          const tagsHtml = (a.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('');
          const dateStr = new Date(a.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

          return `
            <tr data-announcement-row="true">
              <td>
                <div class="announcement-title">
                  <a href="/announcements/${safeId}">${escapeHtml(a.title)}</a>
                </div>
                <div class="announcement-meta">
                  <span>👤 ${escapeHtml(a.author)}</span> • <span>📅 ${dateStr}</span>
                </div>
              </td>
              <td><span class="category-badge cat-${escapeHtml(a.category)}">${escapeHtml(a.category)}</span></td>
              <td><span class="priority-badge prio-${escapeHtml(a.priority)}">${escapeHtml(a.priority)}</span></td>
              <td><div class="tags-wrapper">${tagsHtml || '-'}</div></td>
              <td style="text-align: center;">
                <div class="actions-cell">
                  <a href="/announcements/${safeId}" class="btn-act btn-act-view" title="Görüntüle">👁️ Oku</a>
                  <a href="/announcements/${safeId}/edit" class="btn-act btn-act-edit" title="Düzenle">✏️ Düzenle</a>
                  <form action="/announcements/${safeId}/delete" method="POST" onsubmit="return confirm('Bu duyuruyu silmek istediğinize emin misiniz?');" style="display:inline; margin:0;">
                    <button type="submit" class="btn-act btn-act-del" title="Sil">🗑️ Sil</button>
                  </form>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      } else {
        rowsHtml = `
          <tr>
            <td colspan="5">
              <div class="empty-state">
                <p>Henüz yayınlanmış bir duyuru bulunmuyor. Sol paneldeki formu kullanarak ilk duyurunuzu ekleyebilirsiniz.</p>
              </div>
            </td>
          </tr>
        `;
      }

      html = html.replace('<!-- TEMPLATE_ANNOUNCEMENTS_PLACEHOLDER -->', rowsHtml);
      html = html.replace('<span class="badge-count" id="announcementCount">0</span>', `<span class="badge-count" id="announcementCount">${announcements.length}</span>`);

      return res.status(200).send(html);
    } catch (error) {
      return res.status(500).send(`Duyurular getirilemedi: ${error.message}`);
    }
  }

  /**
   * READ ONE: Detailed view for a single announcement
   * GET /announcements/:id
   */
  static async show(req, res) {
    try {
      const { id } = req.params;
      const announcement = await Announcement.findById(id);

      if (!announcement) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="tr">
          <head><meta charset="UTF-8"><title>Duyuru Bulunamadı</title><style>body{font-family:sans-serif;padding:3rem;text-align:center;}a{color:#2563eb;}</style></head>
          <body>
            <h1>404 - Duyuru Bulunamadı</h1>
            <p>"${escapeHtml(id)}" kimlikli duyuru mevcut değil.</p>
            <p><a href="/announcements">← Duyurular Listesine Dön</a></p>
          </body>
          </html>
        `);
      }

      const viewPath = path.join(__dirname, '..', 'views', 'announcement-detail.html');
      let html = fs.readFileSync(viewPath, 'utf8');

      const tagsHtml = (announcement.tags || []).map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('');
      const dateStr = new Date(announcement.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      html = html
        .replace(/{{ANNOUNCEMENT_ID}}/g, escapeHtml(announcement.id))
        .replace(/{{ANNOUNCEMENT_TITLE}}/g, escapeHtml(announcement.title))
        .replace(/{{ANNOUNCEMENT_CONTENT}}/g, escapeHtml(announcement.content).replace(/\n/g, '<br>'))
        .replace(/{{ANNOUNCEMENT_CATEGORY}}/g, escapeHtml(announcement.category))
        .replace(/{{ANNOUNCEMENT_PRIORITY}}/g, escapeHtml(announcement.priority))
        .replace(/{{ANNOUNCEMENT_AUTHOR}}/g, escapeHtml(announcement.author))
        .replace(/{{ANNOUNCEMENT_DATE}}/g, escapeHtml(dateStr))
        .replace(/{{ANNOUNCEMENT_TAGS}}/g, tagsHtml || '<span style="color:#94a3b8">Etiket yok</span>');

      return res.status(200).send(html);
    } catch (error) {
      return res.status(500).send(`Duyuru yüklenemedi: ${error.message}`);
    }
  }

  /**
   * EDIT VIEW: Edit announcement form view
   * GET /announcements/:id/edit
   */
  static async edit(req, res) {
    try {
      const { id } = req.params;
      const announcement = await Announcement.findById(id);

      if (!announcement) {
        return res.status(404).send('Düzenlenecek duyuru bulunamadı.');
      }

      const viewPath = path.join(__dirname, '..', 'views', 'announcement-edit.html');
      let html = fs.readFileSync(viewPath, 'utf8');

      const categories = ['general', 'academic', 'career', 'event'];
      const categoryOptions = categories.map(c => {
        const selected = (announcement.category === c) ? 'selected' : '';
        const label = c === 'general' ? 'Genel (General)' : c === 'academic' ? 'Akademik (Academic)' : c === 'career' ? 'Kariyer / İş (Career)' : 'Etkinlik (Event)';
        return `<option value="${c}" ${selected}>${label}</option>`;
      }).join('');

      const priorities = ['low', 'medium', 'high', 'urgent'];
      const priorityOptions = priorities.map(p => {
        const selected = (announcement.priority === p) ? 'selected' : '';
        const label = p === 'low' ? 'Düşük (Low)' : p === 'medium' ? 'Normal (Medium)' : p === 'high' ? 'Yüksek (High)' : 'Acil (Urgent)';
        return `<option value="${p}" ${selected}>${label}</option>`;
      }).join('');

      html = html
        .replace(/{{ANNOUNCEMENT_ID}}/g, escapeHtml(announcement.id))
        .replace(/{{ANNOUNCEMENT_TITLE}}/g, escapeHtml(announcement.title))
        .replace(/{{ANNOUNCEMENT_CONTENT}}/g, escapeHtml(announcement.content))
        .replace(/{{CATEGORY_OPTIONS}}/g, categoryOptions)
        .replace(/{{PRIORITY_OPTIONS}}/g, priorityOptions)
        .replace(/{{ANNOUNCEMENT_AUTHOR}}/g, escapeHtml(announcement.author))
        .replace(/{{ANNOUNCEMENT_TAGS}}/g, escapeHtml((announcement.tags || []).join(', ')));

      return res.status(200).send(html);
    } catch (error) {
      return res.status(500).send(`Düzenleme sayfası yüklenemedi: ${error.message}`);
    }
  }

  /**
   * CREATE: Process form submission to create announcement
   * POST /announcements
   */
  static async create(req, res) {
    try {
      const { title, content, category, author, priority, tags } = req.body;

      await Announcement.create({
        title,
        content,
        category: category || 'general',
        author: author || 'Alumni Network Yönetimi',
        priority: priority || 'medium',
        tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : tags
      });

      return res.redirect('/announcements');
    } catch (error) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head><meta charset="UTF-8"><title>Hata</title><style>body{font-family:sans-serif;padding:3rem;text-align:center;}a{color:#2563eb;}</style></head>
        <body>
          <h2>Duyuru Eklenemedi</h2>
          <p style="color:red;">${escapeHtml(error.message)}</p>
          <a href="javascript:history.back()">← Forma Geri Dön</a>
        </body>
        </html>
      `);
    }
  }

  /**
   * UPDATE: Process form submission to update announcement
   * POST /announcements/:id/update or PUT /announcements/:id
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      const updated = await Announcement.findByIdAndUpdate(id, updateData);

      if (!updated) {
        return res.status(404).send('Güncellenecek duyuru bulunamadı.');
      }

      return res.redirect(`/announcements/${id}`);
    } catch (error) {
      return res.status(400).send(`Güncelleme başarısız: ${escapeHtml(error.message)}`);
    }
  }

  /**
   * DELETE: Process announcement deletion
   * POST /announcements/:id/delete or DELETE /announcements/:id
   */
  static async destroy(req, res) {
    try {
      const { id } = req.params;
      const deleted = await Announcement.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).send('Silinecek duyuru bulunamadı.');
      }

      return res.redirect('/announcements');
    } catch (error) {
      return res.status(500).send(`Duyuru silinemedi: ${escapeHtml(error.message)}`);
    }
  }
}

module.exports = AnnouncementController;
