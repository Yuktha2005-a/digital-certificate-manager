const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING COMPLETE END-TO-END TEST SUITE');
  console.log('====================================================\n');

  let token = '';
  let manualCertId = '';
  let uploadedCertId = '';

  // 1. Health check
  console.log('--> Testing Health Check API (/health)...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  if (healthRes.ok && healthData.status === 'OK') {
    console.log('✔ Health Check PASSED:', healthData.message);
  } else {
    throw new Error('Health check failed: ' + JSON.stringify(healthData));
  }

  // 2. Auth: Sign Up (create-admin)
  const testEmail = `admin_test_${Date.now()}@university.edu`;
  const testPassword = 'Password123!';
  console.log(`\n--> Testing Admin Registration (/auth/create-admin) for: ${testEmail}...`);
  const signupRes = await fetch(`${BASE_URL}/auth/create-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Evaluation Admin',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });
  const signupData = await signupRes.json();
  if (signupRes.status === 201 && signupData.success) {
    console.log('✔ Admin Registration PASSED:', signupData.message);
  } else {
    throw new Error('Sign up failed: ' + JSON.stringify(signupData));
  }

  // 3. Auth: Login
  console.log('\n--> Testing Admin Login (/auth/login)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });
  const loginData = await loginRes.json();
  if (loginRes.status === 200 && loginData.token) {
    token = loginData.token;
    console.log('✔ Login PASSED: JWT Token generated successfully');
  } else {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }

  const authHeader = {
    Authorization: `Bearer ${token}`,
  };

  // 4. Auth: Get Current Profile (/auth/me)
  console.log('\n--> Testing Protected Profile (/auth/me)...');
  const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeader });
  const meData = await meRes.json();
  if (meRes.status === 200 && meData.user && meData.user.email === testEmail) {
    console.log(`✔ Auth Me PASSED: Authenticated as ${meData.user.name} (${meData.user.role})`);
  } else {
    throw new Error('/auth/me failed: ' + JSON.stringify(meData));
  }

  // 5. Add Certificate Manually (/certificates)
  console.log('\n--> Testing Manual Certificate Creation (/certificates)...');
  const certUniqueId = `CERT-TEST-${Date.now().toString().slice(-5)}`;
  const now = new Date();
  const issueDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
  const expiryDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days in future -> ACTIVE

  const createRes = await fetch(`${BASE_URL}/certificates`, {
    method: 'POST',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      certificateId: certUniqueId,
      domain: 'google.com',
      issuer: 'Google Trust Services LLC',
      issueDate: issueDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
    }),
  });
  const createData = await createRes.json();
  if (createRes.status === 201 && createData.certificate) {
    manualCertId = createData.certificate._id;
    console.log('✔ Manual Certificate Creation PASSED:');
    console.log(`   ID: ${createData.certificate.certificateId}`);
    console.log(`   Status: ${createData.certificate.status}`);
    console.log(`   Lifecycle history length: ${createData.certificate.lifecycleHistory.length}`);
    console.log(`   Initial Action: ${createData.certificate.lifecycleHistory[0].action}`);
  } else {
    throw new Error('Manual cert creation failed: ' + JSON.stringify(createData));
  }

  // 6. Real Certificate Upload & X.509 Parsing (/certificates/upload)
  console.log('\n--> Testing Real Certificate File Upload (/certificates/upload)...');
  const certFilePath = path.join(__dirname, '..', '..', 'sample-certs', 'github.com.cer');
  if (!fs.existsSync(certFilePath)) {
    throw new Error('Sample cert file not found at: ' + certFilePath);
  }
  const fileBytes = fs.readFileSync(certFilePath);
  const blob = new Blob([fileBytes], { type: 'application/x-x509-ca-cert' });

  const formData = new FormData();
  formData.append('certificateFile', blob, 'github.com.cer');
  formData.append('certificateId', `CERT-GH-${Date.now().toString().slice(-4)}`);

  const uploadRes = await fetch(`${BASE_URL}/certificates/upload`, {
    method: 'POST',
    headers: authHeader, // Do not set Content-Type with FormData
    body: formData,
  });
  const uploadData = await uploadRes.json();
  if (uploadRes.status === 201 && uploadData.certificate) {
    uploadedCertId = uploadData.certificate._id;
    console.log('✔ Certificate File Upload & X.509 Parsing PASSED:');
    console.log(`   Parsed Domain: ${uploadData.certificate.domain}`);
    console.log(`   Parsed Issuer: ${uploadData.certificate.issuer}`);
    console.log(`   Valid From: ${uploadData.certificate.issueDate}`);
    console.log(`   Valid To: ${uploadData.certificate.expiryDate}`);
    console.log(`   Fingerprint SHA-256: ${uploadData.certificate.fingerprint256}`);
    console.log(`   Original File: ${uploadData.certificate.originalFileName}`);
    console.log(`   History Action: ${uploadData.certificate.lifecycleHistory[0].action}`);
  } else {
    throw new Error('Upload failed: ' + JSON.stringify(uploadData));
  }

  // 7. Live TLS Handshake Check (/live-certificates/:id/check-live)
  console.log(`\n--> Testing Live TLS Handshake Check on manual cert (${manualCertId} for google.com:443)...`);
  const liveCheckRes = await fetch(`${BASE_URL}/live-certificates/${manualCertId}/check-live`, {
    method: 'POST',
    headers: authHeader,
  });
  const liveCheckData = await liveCheckRes.json();
  if (liveCheckRes.status === 200 && liveCheckData.liveCertificate) {
    console.log('✔ Live TLS Handshake PASSED:');
    console.log(`   Live Issuer: ${liveCheckData.liveCertificate.issuer}`);
    console.log(`   Live Serial: ${liveCheckData.liveCertificate.serialNumber}`);
    console.log(`   Live Fingerprint: ${liveCheckData.liveCertificate.fingerprint256}`);
    console.log(`   Certificate Changed: ${liveCheckData.changed}`);
    console.log(`   New History Entries: ${liveCheckData.certificate.lifecycleHistory.length}`);
    const lastHistory = liveCheckData.certificate.lifecycleHistory.slice(-1)[0];
    console.log(`   Latest History: [${lastHistory.action}] ${lastHistory.description}`);
  } else {
    throw new Error('Live check failed: ' + JSON.stringify(liveCheckData));
  }

  // 8. Renew Certificate (/certificates/:id/renew)
  console.log('\n--> Testing Certificate Renewal (/certificates/:id/renew)...');
  const extendedExpiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year renewal
  const renewRes = await fetch(`${BASE_URL}/certificates/${manualCertId}/renew`, {
    method: 'PUT',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiryDate: extendedExpiry.toISOString() }),
  });
  const renewData = await renewRes.json();
  if (renewRes.status === 200 && renewData.certificate) {
    console.log('✔ Certificate Renewal PASSED:');
    console.log(`   New Expiry: ${new Date(renewData.certificate.expiryDate).toLocaleDateString()}`);
    console.log(`   Updated Status: ${renewData.certificate.status}`);
    const lastHistory = renewData.certificate.lifecycleHistory.slice(-1)[0];
    console.log(`   Renewal History: [${lastHistory.action}] ${lastHistory.description}`);
  } else {
    throw new Error('Renew failed: ' + JSON.stringify(renewData));
  }

  // 9. Revoke Certificate (/certificates/:id/revoke)
  console.log('\n--> Testing Certificate Revocation (/certificates/:id/revoke)...');
  const revokeRes = await fetch(`${BASE_URL}/certificates/${manualCertId}/revoke`, {
    method: 'PUT',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ revocationReason: 'Key rotation audit in compliance test' }),
  });
  const revokeData = await revokeRes.json();
  if (revokeRes.status === 200 && revokeData.certificate.status === 'REVOKED') {
    console.log('✔ Certificate Revocation PASSED:');
    console.log(`   Status: ${revokeData.certificate.status}`);
    console.log(`   Reason: ${revokeData.certificate.revocationReason}`);
    const lastHistory = revokeData.certificate.lifecycleHistory.slice(-1)[0];
    console.log(`   Revoked History: [${lastHistory.action}] ${lastHistory.description}`);
  } else {
    throw new Error('Revoke failed: ' + JSON.stringify(revokeData));
  }

  // 10. Verify Renew is blocked on Revoked Certificate
  console.log('\n--> Verifying Renewal is Blocked on Revoked Certificate...');
  const blockedRenewRes = await fetch(`${BASE_URL}/certificates/${manualCertId}/renew`, {
    method: 'PUT',
    headers: { ...authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiryDate: new Date(now.getTime() + 500 * 24 * 60 * 60 * 1000).toISOString() }),
  });
  const blockedRenewData = await blockedRenewRes.json();
  if (blockedRenewRes.status === 400 && blockedRenewData.message.includes('Revoked')) {
    console.log('✔ Blocked Renewal Check PASSED: Correctly rejected renewal for revoked cert.');
  } else {
    throw new Error('Expected 400 rejection for renewing revoked cert, got: ' + blockedRenewRes.status);
  }

  // 11. Dashboard Stats (/certificates/stats)
  console.log('\n--> Testing Dashboard Stats (/certificates/stats)...');
  const statsRes = await fetch(`${BASE_URL}/certificates/stats`, { headers: authHeader });
  const statsData = await statsRes.json();
  if (statsRes.status === 200 && statsData.stats) {
    console.log('✔ Dashboard Stats PASSED:');
    console.log('   Metrics:', statsData.stats);
    console.log(`   Attention Required Count: ${statsData.attentionRequired.length}`);
  } else {
    throw new Error('Stats failed: ' + JSON.stringify(statsData));
  }

  // 12. Check All Live Certificates (/live-certificates/check-all)
  console.log('\n--> Testing Batch Live Verification (/live-certificates/check-all)...');
  const checkAllRes = await fetch(`${BASE_URL}/live-certificates/check-all`, {
    method: 'POST',
    headers: authHeader,
  });
  const checkAllData = await checkAllRes.json();
  if (checkAllRes.status === 200 && checkAllData.summary) {
    console.log('✔ Batch Live Verification PASSED:');
    console.log('   Summary:', checkAllData.summary);
  } else {
    throw new Error('Check all failed: ' + JSON.stringify(checkAllData));
  }

  // 13. Search and Filtering (/certificates)
  console.log('\n--> Testing Search and Status Filtering (/certificates?search=...)...');
  const searchRes = await fetch(`${BASE_URL}/certificates?search=github`, { headers: authHeader });
  const searchData = await searchRes.json();
  if (searchRes.status === 200 && searchData.certificates.length > 0) {
    console.log(`✔ Search PASSED: Found ${searchData.certificates.length} matching 'github'`);
  } else {
    throw new Error('Search failed: ' + JSON.stringify(searchData));
  }

  // 14. Safe Delete (/certificates/:id)
  console.log('\n--> Testing Safe Deletion (/certificates/:id)...');
  const deleteRes = await fetch(`${BASE_URL}/certificates/${manualCertId}`, {
    method: 'DELETE',
    headers: authHeader,
  });
  const deleteData = await deleteRes.json();
  if (deleteRes.status === 200 && deleteData.success) {
    console.log('✔ Safe Deletion PASSED:', deleteData.message);
  } else {
    throw new Error('Delete failed: ' + JSON.stringify(deleteData));
  }

  console.log('\n====================================================');
  console.log('ALL END-TO-END TESTS COMPLETED SUCCESSFULLY! 🎉');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err.message);
  process.exit(1);
});
