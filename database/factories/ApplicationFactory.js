const crypto = require('crypto');
const Application = require('../../models/Application');

const COVER_LETTERS = [
  'Merhaba, ilanınızdaki pozisyonda belirtilen teknolojiler üzerinde 3 yılı aşkın deneyimim bulunmaktadır. Ekibinize değer katabileceğime inanıyorum.',
  'Sayın Yetkili, üniversitemiz mezunlar ağında paylaşılan bu fırsat kariyer hedeflerimle birebir örtüşmektedir. Özgeçmişimi incelemenize sunarım.',
  'Merhaba, açık kaynak projelerim ve geçmiş staj deneyimlerimle bu pozisyonun gerekliliklerini karşılamaktayım. Mülakat fırsatı verilmesini rica ederim.',
  'Pozisyon gereksinimlerini dikkatle inceledim. Hem teknik yetkinliklerim hem de takım çalışmasına yatkınlığımla projelerinize katkı sağlamak isterim.'
];

const STATUSES = ['pending', 'reviewing', 'accepted', 'rejected'];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class ApplicationFactory {
  /**
   * Generates a raw application data object without saving it.
   * @param {Object} [overrides={}]
   * @returns {Object}
   */
  static make(overrides = {}) {
    const randId = crypto.randomBytes(3).toString('hex');
    return {
      jobId: overrides.jobId || crypto.randomUUID(),
      userId: overrides.userId || crypto.randomUUID(),
      resumeUrl: overrides.resumeUrl || `https://storage.alumni.org/cv/applicant_${randId}.pdf`,
      coverLetter: overrides.coverLetter || randomChoice(COVER_LETTERS),
      status: overrides.status || randomChoice(STATUSES),
      notes: overrides.notes || null,
      ...overrides
    };
  }

  /**
   * Generates and persists an application.
   * @param {Object} [overrides={}]
   * @returns {Promise<Application>}
   */
  static async create(overrides = {}) {
    const data = this.make(overrides);
    return Application.create(data);
  }

  /**
   * Generates and persists multiple applications.
   * @param {Array<{jobId: string, userId: string}>} pairs
   * @returns {Promise<Application[]>}
   */
  static async createPairs(pairs = []) {
    const items = [];
    for (const pair of pairs) {
      const item = await this.create(pair);
      items.push(item);
    }
    return items;
  }
}

module.exports = ApplicationFactory;
