const User = require('../models/User');
const Announcement = require('../models/Announcement');
const UserFactory = require('./factories/UserFactory');
const AnnouncementFactory = require('./factories/AnnouncementFactory');
const db = require('../config/db');

async function seed() {
  console.log('🌱 Starting database seeding...');

  // 1. Core Users Seed
  console.log('  Seeding core users...');

  // Admin user
  const adminExists = await User.findByEmail('admin@alumni.org');
  if (!adminExists) {
    await User.create({
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
  const alumniExists = await User.findByEmail('merve.arslan@alumni.org');
  if (!alumniExists) {
    await User.create({
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
  const studentExists = await User.findByEmail('baran.kaya@alumni.org');
  if (!studentExists) {
    await User.create({
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

  // Generate 4 additional mock users via Factory
  console.log('  Generating random users via UserFactory...');
  const factoryUsers = await UserFactory.createMany(4);
  console.log(`    ✅ Created ${factoryUsers.length} factory users.`);

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

  const finalUserCount = await User.count();
  const finalAnnouncementCount = await Announcement.count();

  console.log('\n=============================================');
  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
  console.log(`   Total Users: ${finalUserCount}`);
  console.log(`   Total Announcements: ${finalAnnouncementCount}`);
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
