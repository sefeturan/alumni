const User = require('../models/User');
const Announcement = require('../models/Announcement');
const JobPosting = require('../models/JobPosting');
const Application = require('../models/Application');
const UserFactory = require('./factories/UserFactory');
const AnnouncementFactory = require('./factories/AnnouncementFactory');
const JobPostingFactory = require('./factories/JobPostingFactory');
const ApplicationFactory = require('./factories/ApplicationFactory');
const db = require('../config/db');

async function seed() {
  console.log('🌱 Starting database seeding...');

  // 1. Core Users Seed
  console.log('  Seeding core users...');

  // Admin user
  let admin = await User.findByEmail('admin@alumni.org');
  if (!admin) {
    admin = await User.create({
      name: 'Sistem Yöneticisi',
      email: 'admin@alumni.org',
      password: 'admin_secure_password',
      role: 'admin',
      graduationYear: 2012,
      department: 'Bilgisayar Mühendisliği',
      company: 'Alumni Network Platform',
      title: 'Head of Community',
      skills: ['Leadership', 'System Administration', 'Community Building'],
      bio: 'Alumni Network ana sistem yöneticisi ve topluluk koordinatörü.'
    });
    console.log('    ✅ Admin user created: admin@alumni.org');
  }

  // Sample Featured Alumni
  let alumni = await User.findByEmail('merve.arslan@alumni.org');
  if (!alumni) {
    alumni = await User.create({
      name: 'Merve Arslan',
      email: 'merve.arslan@alumni.org',
      password: 'password123',
      role: 'alumni',
      graduationYear: 2018,
      department: 'Yazılım Mühendisliği',
      company: 'Google Zürich',
      title: 'Staff Software Engineer',
      skills: ['Distributed Systems', 'Go', 'Kubernetes', 'Cloud'],
      bio: '2018 mezunu. Bulut altyapıları ve dağıtık sistemler üzerine çalışıyor.'
    });
    console.log('    ✅ Featured Alumni created: merve.arslan@alumni.org');
  }

  // Sample Student
  let student = await User.findByEmail('baran.kaya@alumni.org');
  if (!student) {
    student = await User.create({
      name: 'Baran Kaya',
      email: 'baran.kaya@alumni.org',
      password: 'password123',
      role: 'student',
      graduationYear: 2027,
      department: 'Endüstri Mühendisliği',
      company: 'Üniversite Kulübü',
      title: 'Öğrenci Temsilcisi',
      skills: ['Python', 'Veri Analitiği', 'Proje Yönetimi'],
      bio: 'Son sınıf öğrencisi, mezun mentörlüğü arıyor.'
    });
    console.log('    ✅ Featured Student created: baran.kaya@alumni.org');
  }

  // Additional mock users via Factory if needed
  const currentUserCount = await User.count();
  if (currentUserCount < 5) {
    console.log('  Generating random users via UserFactory...');
    const factoryUsers = await UserFactory.createMany(4);
    console.log(`    ✅ Created ${factoryUsers.length} factory users.`);
  }

  // 2. Announcements Seed
  console.log('  Seeding announcements...');
  const currentAnnouncements = await Announcement.count();
  if (currentAnnouncements < 3) {
    await Announcement.create({
      title: '2026 Geleneksel Mezunlar Günü Tarihi Belirlendi',
      content: 'Tüm mezunlarımızı kampüs bahçesinde düzenlenecek buluşmaya davet ediyoruz. Kayıt formunu doldurmayı unutmayınız.',
      category: 'event',
      author: 'Rektörlük Mezunlar Ofisi',
      priority: 'urgent',
      tags: ['MezunlarGünü', 'Kampüs', 'Networking']
    });

    await Announcement.create({
      title: 'Yeni Mezunlar İçin Teknoloji Şirketlerinde Kariyer Fırsatları',
      content: 'Partner teknoloji firmalarımızın mezun ağımıza özel açtığı staj ve tam zamanlı pozisyonlar listelenmiştir.',
      category: 'career',
      author: 'Kariyer Merkezi',
      priority: 'high',
      tags: ['Kariyer', 'Staj', 'İstihdam']
    });

    await AnnouncementFactory.createMany(2);
    console.log('    ✅ Core and factory announcements created.');
  }

  // 3. Job Postings Seed
  console.log('  Seeding job postings...');
  let job1 = (await JobPosting.findAll({ company: 'Google Cloud EMEA' }))[0];
  if (!job1) {
    job1 = await JobPosting.create({
      userId: alumni.id,
      title: 'Senior Cloud Systems Software Engineer',
      company: 'Google Cloud EMEA',
      location: 'Zürich, İsviçre / Hibrit',
      workType: 'hybrid',
      employmentType: 'full-time',
      experienceLevel: 'senior',
      description: 'Zürich ofisimizdeki dağıtık sistemler ekibinde görev alacak, mezun ağımızdan deneyimli yazılım mühendisleri arıyoruz.',
      requirements: ['Go / C++', 'Kubernetes', 'Cloud Infrastructure', '5+ yıl deneyim'],
      salaryRange: '130.000 - 170.000 CHF',
      applicationUrl: 'https://careers.google.com/jobs/results/alumni-referral'
    });
  }

  let job2 = (await JobPosting.findAll({ company: 'Alumni Tech Network Partners' }))[0];
  if (!job2) {
    job2 = await JobPosting.create({
      userId: admin.id,
      title: 'Yazılım ve Yapay Zekâ Yaz Dönemi Stajı 2026',
      company: 'Alumni Tech Network Partners',
      location: 'İstanbul (Maslak) / Uzaktan',
      workType: 'remote',
      employmentType: 'internship',
      experienceLevel: 'intern',
      description: 'Üniversitemiz mezunlarının kurucusu olduğu teknoloji girişimlerinde 3 ay süreli mentorlü yaz stajı imkânı.',
      requirements: ['Node.js veya Python', 'Git', 'Meraklı ve öğrenmeye açık'],
      salaryRange: 'Stajyer Bursu Destekli',
      applicationUrl: 'https://alumni.org/staj-basvuru-2026'
    });
  }

  const currentJobCount = await JobPosting.count();
  if (currentJobCount < 4) {
    await JobPostingFactory.createMany(2, { userId: alumni.id });
    console.log('    ✅ Core and factory job postings created.');
  }

  // 4. Applications Seed
  console.log('  Seeding job applications...');
  const currentAppCount = await Application.count();
  if (currentAppCount < 2 && job1 && job2 && student) {
    const existingApp1 = await Application.findByJobAndUser(job2.id, student.id);
    if (!existingApp1) {
      await Application.create({
        jobId: job2.id,
        userId: student.id,
        resumeUrl: 'https://storage.alumni.org/resumes/baran-kaya-cv.pdf',
        coverLetter: 'Merhaba, üniversitemiz bünyesinde açılan staj programında aktif görev almak ve kendimi geliştirmek istiyorum.',
        status: 'reviewing',
        notes: 'Öğrenci temsilcisi, not ortalaması yüksek ve motivasyonu kuvvetli.'
      });
      console.log('    ✅ Student application created for internship.');
    }

    const existingApp2 = await Application.findByJobAndUser(job1.id, student.id);
    if (!existingApp2) {
      await Application.create({
        jobId: job1.id,
        userId: student.id,
        resumeUrl: 'https://storage.alumni.org/resumes/baran-kaya-cv.pdf',
        coverLetter: 'Bulut altyapıları ve dağıtık sistemler konusunda mentörlük ve staj imkanı arıyorum.',
        status: 'pending'
      });
      console.log('    ✅ Student application created for cloud engineering.');
    }
  }

  const finalUserCount = await User.count();
  const finalAnnouncementCount = await Announcement.count();
  const finalJobCount = await JobPosting.count();
  const finalAppCount = await Application.count();

  console.log('\n=============================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`   Total Users: ${finalUserCount}`);
  console.log(`   Total Announcements: ${finalAnnouncementCount}`);
  console.log(`   Total Job Postings: ${finalJobCount}`);
  console.log(`   Total Applications: ${finalAppCount}`);
  console.log('=============================================\n');
}

// Allow CLI execution directly
if (require.main === module) {
  seed()
    .then(() => {
      db.closePool();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err.message);
      db.closePool();
      process.exit(1);
    });
}

module.exports = seed;
