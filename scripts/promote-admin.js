const User = require('../src/models/User');

async function main() {
  const email = String(process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: node scripts/promote-admin.js user@example.com');
    process.exitCode = 1;
    return;
  }
  const user = await User.findByEmail(email);
  if (!user) {
    console.error(`No account found for ${email}. Register first, then run this command again.`);
    process.exitCode = 1;
    return;
  }
  await User.findByIdAndUpdate(user.id, { role: 'admin' });
  console.log(`Administrator role assigned to ${email}.`);
}

main().catch(error => {
  console.error('Could not promote administrator:', error.message);
  process.exitCode = 1;
});
