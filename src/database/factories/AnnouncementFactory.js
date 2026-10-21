const crypto = require('crypto');
const Announcement = require('../../models/Announcement');

const ANNOUNCEMENT_TEMPLATES = [
  {
    title: 'Yıllık Mezunlar ve Kariyer Zirvesi 2026',
    content: 'Tüm mezunlarımızı ve son sınıf öğrencilerimizi kampüs ana oditoryumunda bir araya getiren kariyer ve networking zirvesi bu hafta sonu gerçekleşecek.',
    category: 'event',
    priority: 'urgent',
    tags: ['Etkinlik', 'Zirve', 'Networking']
  },
  {
    title: 'Global Tech Şirketleri İçin Mezun Mentörlük Programı',
    content: 'Sektörde 5+ yıl deneyimli mezunlarımız ile yeni mezunlarımızı buluşturan mentörlük programı başvuruları açıldı.',
    category: 'career',
    priority: 'high',
    tags: ['Mentörlük', 'Kariyer', 'Gelişim']
  },
  {
    title: 'Yapay Zekâ ve Veri Bilimi Yüksek Lisans Bursu Duyurusu',
    content: 'Fakültemiz mezunları için açılan tam burslu araştırma programı detayları ve başvuru koşulları web sitemizde yayımlandı.',
    category: 'academic',
    priority: 'medium',
    tags: ['Akademik', 'Burs', 'Yüksek Lisans']
  },
  {
    title: 'Alumni Network Mobil Uygulaması Beta Test Süreci',
    content: 'Mezunlarımızın birbirleriyle anlık mesajlaşabileceği yeni mobil uygulamamızın kapalı beta testi başladı.',
    category: 'general',
    priority: 'medium',
    tags: ['Duyuru', 'Mobil', 'Topluluk']
  },
  {
    title: 'Yurt Dışında Yaşayan Mezunlar Çevrim İçi Paneli',
    content: 'Avrupa ve Amerika’da kariyerini sürdüren mezunlarımızın katılımıyla küresel iş piyasası üzerine çevrim içi panel düzenlenecektir.',
    category: 'event',
    priority: 'high',
    tags: ['Global', 'Webinar', 'Kariyer']
  }
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class AnnouncementFactory {
  /**
   * Generates a raw announcement data object without saving it.
   * @param {Object} [overrides={}]
   * @returns {Object}
   */
  static make(overrides = {}) {
    const template = randomChoice(ANNOUNCEMENT_TEMPLATES);
    const randSuffix = crypto.randomBytes(2).toString('hex');

    return {
      title: overrides.title || `${template.title} (#${randSuffix})`,
      content: overrides.content || template.content,
      category: overrides.category || template.category,
      author: overrides.author || 'Alumni Network Yönetimi',
      priority: overrides.priority || template.priority,
      tags: overrides.tags || template.tags,
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      ...overrides
    };
  }

  /**
   * Generates and persists an announcement using the Announcement model.
   * @param {Object} [overrides={}]
   * @returns {Promise<Announcement>}
   */
  static async create(overrides = {}) {
    const data = this.make(overrides);
    return Announcement.create(data);
  }

  /**
   * Generates and persists multiple announcements.
   * @param {number} count
   * @param {Object} [overrides={}]
   * @returns {Promise<Announcement[]>}
   */
  static async createMany(count = 5, overrides = {}) {
    const items = [];
    for (let i = 0; i < count; i++) {
      const item = await this.create(overrides);
      items.push(item);
    }
    return items;
  }
}

module.exports = AnnouncementFactory;
