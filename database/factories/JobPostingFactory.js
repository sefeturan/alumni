const crypto = require('crypto');
const JobPosting = require('../../models/JobPosting');

const JOB_TEMPLATES = [
  {
    title: 'Senior Full Stack Developer (Node.js & React)',
    company: 'FinTech Innovations',
    location: 'İstanbul (Maslak) / Hibrit',
    workType: 'hybrid',
    employmentType: 'full-time',
    experienceLevel: 'senior',
    description: 'Ödeme sistemleri ve açık bankacılık altyapımızda görev alacak, mikroservis mimarisine hakim takım arkadaşı arıyoruz.',
    requirements: ['Node.js', 'React', 'PostgreSQL', 'Docker', 'Kubernetes'],
    salaryRange: '100.000 - 140.000 TL',
    applicationUrl: 'https://careers.fintech.example.com/apply/fullstack'
  },
  {
    title: 'Yazılım Mühendisliği Yaz Stajyeri',
    company: 'Baykar Teknoloji',
    location: 'İstanbul (Hadımköy) / Yerinde',
    workType: 'on-site',
    employmentType: 'internship',
    experienceLevel: 'intern',
    description: 'Havacılık ve otonom sistemler yazılım ekibimizde gerçek projelerde staj yapacak 3. veya 4. sınıf öğrencileri.',
    requirements: ['C++', 'Python', 'Algoritmalar ve Veri Yapıları', 'Linux'],
    salaryRange: 'Asgari Ücret + Ulaşım/Yemek',
    applicationUrl: 'https://kariyer.baykar.example.com/staj2026'
  },
  {
    title: 'Cloud DevOps Engineer',
    company: 'Getir Global',
    location: 'Uzaktan (Remote)',
    workType: 'remote',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    description: 'Bulut altyapılarımızın ölçeklenmesi, Terraform ve CI/CD pipeline süreçlerinin yönetimi.',
    requirements: ['AWS', 'Terraform', 'CI/CD', 'Docker', 'Monitoring/Prometheus'],
    salaryRange: '90.000 - 125.000 TL',
    applicationUrl: 'https://getir.example.com/jobs/devops'
  },
  {
    title: 'Junior Data Scientist / Yapay Zekâ Mühendisi',
    company: 'Aselsan',
    location: 'Ankara (Gölbaşı) / Yerinde',
    workType: 'on-site',
    employmentType: 'full-time',
    experienceLevel: 'entry',
    description: 'Büyük veri analitiği, bilgisayarlı görü ve derin öğrenme modelleri geliştirecek yeni mezun mühendisler.',
    requirements: ['Python', 'PyTorch/TensorFlow', 'SQL', 'Computer Vision'],
    salaryRange: '85.000 - 110.000 TL',
    applicationUrl: 'https://kariyer.aselsan.example.com/jobs/ai'
  }
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class JobPostingFactory {
  /**
   * Generates a raw job posting data object without saving it.
   * @param {Object} [overrides={}]
   * @returns {Object}
   */
  static make(overrides = {}) {
    const template = randomChoice(JOB_TEMPLATES);
    const randSuffix = crypto.randomBytes(2).toString('hex');

    return {
      userId: overrides.userId || crypto.randomUUID(),
      title: overrides.title || `${template.title} (#${randSuffix})`,
      company: overrides.company || template.company,
      location: overrides.location || template.location,
      workType: overrides.workType || template.workType,
      employmentType: overrides.employmentType || template.employmentType,
      experienceLevel: overrides.experienceLevel || template.experienceLevel,
      description: overrides.description || template.description,
      requirements: overrides.requirements || template.requirements,
      salaryRange: overrides.salaryRange || template.salaryRange,
      applicationUrl: overrides.applicationUrl || template.applicationUrl,
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
      deadline: overrides.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides
    };
  }

  /**
   * Generates and persists a job posting.
   * @param {Object} [overrides={}]
   * @returns {Promise<JobPosting>}
   */
  static async create(overrides = {}) {
    const data = this.make(overrides);
    return JobPosting.create(data);
  }

  /**
   * Generates and persists multiple job postings.
   * @param {number} count
   * @param {Object} [overrides={}]
   * @returns {Promise<JobPosting[]>}
   */
  static async createMany(count = 3, overrides = {}) {
    const items = [];
    for (let i = 0; i < count; i++) {
      const item = await this.create(overrides);
      items.push(item);
    }
    return items;
  }
}

module.exports = JobPostingFactory;
