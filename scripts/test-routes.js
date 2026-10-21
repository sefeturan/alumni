/**
 * Route Verification Script
 * Tests Direct and Nested REST API Routes for Users, Jobs, and Applications
 */
const http = require('http');
const app = require('../src/app');
const User = require('../src/models/User');
const JobPosting = require('../src/models/JobPosting');

async function testRoutes() {
  console.log('====================================================');
  console.log('🧪 TESTING DIRECT & NESTED API ROUTES');
  console.log('====================================================\n');

  // Start app on ephemeral port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Prepare test users
    const author = await User.create({
      name: 'Route Test Author',
      email: `route_author_${Date.now()}@alumni.org`,
      role: 'alumni'
    });
    const applicant = await User.create({
      name: 'Route Test Applicant',
      email: `route_applicant_${Date.now()}@alumni.org`,
      role: 'student'
    });
    console.log(`[Setup] Created test author: ${author.id}`);
    console.log(`[Setup] Created test applicant: ${applicant.id}`);

    // Helper fetch wrapper
    async function request(endpoint, options = {}) {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    }

    // ----------------------------------------------------
    // TEST DIRECT ROUTES (/api/jobs)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Direct Routes (/api/jobs) ---');

    const postRes = await request('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        userId: author.id,
        title: 'Direct Route Software Engineer',
        company: 'Direct Corp',
        location: 'Remote',
        workType: 'remote',
        description: 'Created via direct route POST /api/jobs'
      })
    });
    console.log(`  POST /api/jobs -> Status: ${postRes.status}, ID: ${postRes.data.data?.id}`);
    if (postRes.status !== 201) throw new Error('Direct POST /api/jobs failed');
    const createdJobId = postRes.data.data.id;

    const getAllRes = await request('/api/jobs');
    console.log(`  GET /api/jobs -> Status: ${getAllRes.status}, Count: ${getAllRes.data.count}`);
    if (getAllRes.status !== 200) throw new Error('Direct GET /api/jobs failed');

    const getOneRes = await request(`/api/jobs/${createdJobId}`);
    console.log(`  GET /api/jobs/:id -> Status: ${getOneRes.status}, Title: "${getOneRes.data.data?.title}"`);
    if (getOneRes.status !== 200) throw new Error('Direct GET /api/jobs/:id failed');

    // ----------------------------------------------------
    // TEST NESTED ROUTES (/api/users/:userId/jobs)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Nested Routes (/api/users/:userId/jobs) ---');

    const nestedGetRes = await request(`/api/users/${author.id}/jobs`);
    console.log(`  GET /api/users/:userId/jobs -> Status: ${nestedGetRes.status}, Count for User: ${nestedGetRes.data.count}`);
    if (nestedGetRes.status !== 200) throw new Error('Nested GET jobs failed');

    const nestedPostRes = await request(`/api/users/${author.id}/jobs`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Nested Route Intern',
        company: 'Nested Tech',
        description: 'Job created via nested route'
      })
    });
    console.log(`  POST /api/users/:userId/jobs -> Status: ${nestedPostRes.status}, ID: ${nestedPostRes.data.data?.id}`);
    if (nestedPostRes.status !== 201) throw new Error('Nested POST jobs failed');
    const nestedJobId = nestedPostRes.data.data.id;

    // ----------------------------------------------------
    // TEST DIRECT APPLICATION ROUTES (/api/applications)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Direct Application Routes (/api/applications) ---');

    const appPostRes = await request('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        jobId: createdJobId,
        userId: applicant.id,
        resumeUrl: 'https://cv.example.com/direct.pdf',
        coverLetter: 'Direct application submission'
      })
    });
    console.log(`  POST /api/applications -> Status: ${appPostRes.status}, ID: ${appPostRes.data.data?.id}`);
    if (appPostRes.status !== 201) throw new Error('Direct POST /api/applications failed');
    const appId = appPostRes.data.data.id;

    const appGetRes = await request('/api/applications');
    console.log(`  GET /api/applications -> Status: ${appGetRes.status}, Count: ${appGetRes.data.count}`);
    if (appGetRes.status !== 200) throw new Error('Direct GET /api/applications failed');

    const appPutRes = await request(`/api/applications/${appId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'reviewing', notes: 'Review in progress' })
    });
    console.log(`  PUT /api/applications/:id -> Status: ${appPutRes.status}, Status: "${appPutRes.data.data?.status}"`);
    if (appPutRes.status !== 200 || appPutRes.data.data?.status !== 'reviewing') throw new Error('Direct PUT failed');

    // ----------------------------------------------------
    // TEST NESTED APPLICATION ROUTES
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Nested Job Applications (/api/jobs/:jobId/applications) ---');

    const jobAppsRes = await request(`/api/jobs/${createdJobId}/applications`);
    console.log(`  GET /api/jobs/:jobId/applications -> Status: ${jobAppsRes.status}, Count: ${jobAppsRes.data.count}`);
    if (jobAppsRes.status !== 200) throw new Error('Nested job applications GET failed');

    // Nested Apply to second job
    const applyRes = await request(`/api/jobs/${nestedJobId}/applications`, {
      method: 'POST',
      body: JSON.stringify({
        userId: applicant.id,
        resumeUrl: 'https://cv.example.com/nested.pdf',
        coverLetter: 'Applying through nested route'
      })
    });
    console.log(`  POST /api/jobs/:jobId/applications -> Status: ${applyRes.status}, ID: ${applyRes.data.data?.id}`);
    if (applyRes.status !== 201) throw new Error('Nested job apply failed');

    console.log('\n--- 5. Testing Nested User Applications (/api/users/:userId/applications) ---');
    const userAppsRes = await request(`/api/users/${applicant.id}/applications`);
    console.log(`  GET /api/users/:userId/applications -> Status: ${userAppsRes.status}, Count for User: ${userAppsRes.data.count}`);
    if (userAppsRes.status !== 200 || userAppsRes.data.count < 2) throw new Error('Nested user applications GET failed');

    console.log('\n====================================================');
    console.log('🎉 ALL DIRECT & NESTED ROUTES VERIFIED SUCCESSFULLY!');
    console.log('====================================================\n');
  } finally {
    server.close();
  }
}

testRoutes().catch((err) => {
  console.error('Route test error:', err);
  process.exit(1);
});
