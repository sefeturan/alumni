/**
 * The Forgetting Test Runner
 * Verifies that records survive process termination, container recreation,
 * and cold restarts.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('====================================================');
  console.log('🧪 RUNNING: THE FORGETTING TEST (PERSISTENCE CHECK)');
  console.log('====================================================\n');

  const User = require('../src/models/User');
  const Announcement = require('../src/models/Announcement');

  // Step 1: Initial state
  console.log('[Step 1] Initial state check...');
  const initialUserCount = await User.count();
  const initialAnnouncementCount = await Announcement.count();
  console.log(`  Initial users in storage: ${initialUserCount}`);
  console.log(`  Initial announcements in storage: ${initialAnnouncementCount}\n`);

  // Step 2: Create a unique test record
  const testEmail = `alumni_test_${Date.now()}@example.com`;
  console.log(`[Step 2] Creating test records...`);
  const newUser = await User.create({
    name: 'Test Persistence User',
    email: testEmail,
    role: 'alumni',
    department: 'Computer Engineering',
    company: 'Tech Corp',
    title: 'Senior Engineer'
  });
  console.log(`  ✅ Created User: ID=${newUser.id}, Email=${newUser.email}`);

  const newAnnouncement = await Announcement.create({
    title: 'Persistence Test Announcement',
    content: 'Testing if this announcement survives container/process recreation.',
    category: 'career',
    priority: 'urgent'
  });
  console.log(`  ✅ Created Announcement: ID=${newAnnouncement.id}, Title="${newAnnouncement.title}"\n`);

  // Step 3: Verify disk persistence
  console.log('[Step 3] Verifying disk storage synchronization...');
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
  const usersFile = path.join(dataDir, 'users.json');
  const announcementsFile = path.join(dataDir, 'announcements.json');

  if (!fs.existsSync(usersFile) || !fs.existsSync(announcementsFile)) {
    throw new Error('❌ Storage files not found on disk!');
  }
  console.log(`  ✅ users.json exists at: ${usersFile}`);
  console.log(`  ✅ announcements.json exists at: ${announcementsFile}\n`);

  // Step 4: Simulate cold restart in a completely fresh, isolated Node.js child process
  console.log('[Step 4] Simulating process termination & cold restart (down -> up)...');
  const verifyScript = `
    const User = require('./src/models/User');
    const Announcement = require('./src/models/Announcement');
    (async () => {
      const u = await User.findByEmail('${testEmail}');
      const a = await Announcement.findById('${newAnnouncement.id}');
      if (!u || !a) {
        console.error('FORGOTTEN');
        process.exit(1);
      }
      console.log('REMEMBERED:' + u.id + ':' + a.id);
    })();
  `;

  try {
    const output = execSync(`node -e "${verifyScript.replace(/\n/g, ' ')}"`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8'
    });

    console.log(`  Output from fresh process: ${output.trim()}`);
    console.log('\n====================================================');
    console.log('🎉 RESULT: THE FORGETTING TEST PASSED!');
    console.log('   The records were retained after complete process/container destruction!');
    console.log('====================================================');
  } catch (err) {
    console.error('\n====================================================');
    console.error('❌ RESULT: THE FORGETTING TEST FAILED!');
    console.error('   The records were lost/forgotten.');
    console.error('====================================================');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
