const crypto = require('crypto');
const User = require('../../models/User');

const FIRST_NAMES = ['Ahmet', 'Zeynep', 'Mehmet', 'Elif', 'Can', 'Selin', 'Burak', 'Ayşe', 'Emre', 'Deniz'];
const LAST_NAMES = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan'];
const DEPARTMENTS = [
  'Bilgisayar Mühendisliği',
  'Yazılım Mühendisliği',
  'Elektrik-Elektronik Mühendisliği',
  'Endüstri Mühendisliği',
  'Yönetim Bilişim Sistemleri'
];
const COMPANIES = ['Trendyol', 'Getir', 'Hepsiburada', 'Aselsan', 'Baykar', 'Amazon', 'Microsoft', 'FinTech Corp'];
const TITLES = [
  'Software Engineer',
  'Backend Developer',
  'Frontend Developer',
  'Full Stack Developer',
  'DevOps Specialist',
  'Product Manager',
  'Data Scientist'
];
const SKILL_SETS = [
  ['JavaScript', 'Node.js', 'Express', 'PostgreSQL'],
  ['Python', 'Django', 'FastAPI', 'Docker'],
  ['React', 'TypeScript', 'Next.js', 'TailwindCSS'],
  ['Go', 'Kubernetes', 'Microservices', 'AWS'],
  ['Java', 'Spring Boot', 'Kafka', 'Redis']
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class UserFactory {
  /**
   * Generates a raw user data object without saving it.
   * @param {Object} [overrides={}] - Attributes to override
   * @returns {Object}
   */
  static make(overrides = {}) {
    const firstName = randomChoice(FIRST_NAMES);
    const lastName = randomChoice(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const randId = crypto.randomBytes(3).toString('hex');
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randId}@alumni.org`;

    return {
      name: fullName,
      email: email,
      password: 'password123',
      role: overrides.role || (Math.random() > 0.3 ? 'alumni' : 'student'),
      graduationYear: overrides.graduationYear || (2015 + Math.floor(Math.random() * 11)),
      department: overrides.department || randomChoice(DEPARTMENTS),
      company: overrides.company || randomChoice(COMPANIES),
      title: overrides.title || randomChoice(TITLES),
      skills: overrides.skills || randomChoice(SKILL_SETS),
      bio: overrides.bio || `${fullName}, teknoloji ve mezunlar topluluğu aktif üyesi.`,
      ...overrides
    };
  }

  /**
   * Generates and persists a user using the User model.
   * @param {Object} [overrides={}]
   * @returns {Promise<User>}
   */
  static async create(overrides = {}) {
    const data = this.make(overrides);
    return User.create(data);
  }

  /**
   * Generates and persists multiple users.
   * @param {number} count
   * @param {Object} [overrides={}]
   * @returns {Promise<User[]>}
   */
  static async createMany(count = 5, overrides = {}) {
    const users = [];
    for (let i = 0; i < count; i++) {
      const user = await this.create(overrides);
      users.push(user);
    }
    return users;
  }
}

module.exports = UserFactory;
