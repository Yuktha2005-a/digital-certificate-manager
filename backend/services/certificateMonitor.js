const Certificate = require('../models/Certificate');

/**
 * Runs a single monitoring cycle across all non-revoked certificates
 * Recalculates status based on current date and 30-day threshold
 */
const runMonitoringCycle = async () => {
  try {
    const certificates = await Certificate.find({ status: { $ne: 'REVOKED' } });

    let updatedCount = 0;

    for (const cert of certificates) {
      const calculatedStatus = cert.calculateStatus();
      if (cert.status !== calculatedStatus) {
        cert.status = calculatedStatus;
        await cert.save();
        updatedCount++;
      }
    }

    console.log(`Certificate monitoring completed. ${updatedCount} certificate(s) updated.`);
    return { success: true, updatedCount, totalScanned: certificates.length };
  } catch (error) {
    console.error('Error in certificate monitoring cycle:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Initializes the certificate monitoring service
 * Runs once on start, and then every 1 hour (3600000 ms)
 */
const startCertificateMonitor = () => {
  console.log('Certificate monitoring service started.');

  // Run initial pass after 3 seconds so DB connection is established
  setTimeout(() => {
    runMonitoringCycle();
  }, 3000);

  // Set recurring interval: every 1 hour
  const ONE_HOUR_MS = 60 * 60 * 1000;
  setInterval(() => {
    runMonitoringCycle();
  }, ONE_HOUR_MS);
};

module.exports = {
  startCertificateMonitor,
  runMonitoringCycle,
};
