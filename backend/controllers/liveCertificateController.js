const tls = require('tls');
const Certificate = require('../models/Certificate');

// Helper to extract readable Issuer
const extractIssuer = (issuerStr) => {
  if (!issuerStr) return 'Unknown Issuer';
  const cnMatch = issuerStr.match(/CN=([^/\n\r,]+)/i);
  const oMatch = issuerStr.match(/O=([^/\n\r,]+)/i);
  if (cnMatch && oMatch) {
    return `${cnMatch[1].trim()} (${oMatch[1].trim()})`;
  }
  if (cnMatch) return cnMatch[1].trim();
  if (oMatch) return oMatch[1].trim();
  return issuerStr.replace(/\n/g, ', ').trim();
};

// Helper to sanitize hostname from domain string
const cleanHostname = (domain) => {
  if (!domain) return '';
  return domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .split(':')[0]
    .trim();
};

// Helper to fetch live TLS certificate using Node.js TLS
const fetchLiveTlsCertificate = (domain, timeoutMs = 10000) => {
  return new Promise((resolve, reject) => {
    const hostname = cleanHostname(domain);
    if (!hostname) {
      return reject(new Error('Invalid domain name provided.'));
    }

    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname, // SNI support
        rejectUnauthorized: false, // Allows checking expired or self-signed certs
        timeout: timeoutMs,
      },
      () => {
        try {
          // In Node.js 15.6+, getPeerX509Certificate returns a crypto.X509Certificate object
          let x509 = null;
          if (typeof socket.getPeerX509Certificate === 'function') {
            x509 = socket.getPeerX509Certificate();
          }

          if (x509) {
            const result = {
              serialNumber: x509.serialNumber || '',
              fingerprint256: x509.fingerprint256 || '',
              expiryDate: new Date(x509.validTo),
              issuer: extractIssuer(x509.issuer),
              subject: x509.subject || '',
            };
            socket.destroy();
            return resolve(result);
          }

          // Fallback if getPeerX509Certificate is unavailable
          const peerCert = socket.getPeerCertificate(true);
          if (!peerCert || !peerCert.valid_to) {
            socket.destroy();
            return reject(new Error('No TLS certificate found on host.'));
          }

          const result = {
            serialNumber: peerCert.serialNumber || '',
            fingerprint256: peerCert.fingerprint256 || peerCert.fingerprint || '',
            expiryDate: new Date(peerCert.valid_to),
            issuer: peerCert.issuer ? (peerCert.issuer.CN || peerCert.issuer.O || 'Unknown') : 'Unknown',
            subject: peerCert.subject ? (peerCert.subject.CN || hostname) : hostname,
          };

          socket.destroy();
          return resolve(result);
        } catch (err) {
          socket.destroy();
          return reject(err);
        }
      }
    );

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Connection to ${hostname}:443 timed out after ${timeoutMs}ms.`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(new Error(`TLS connection error to ${hostname}:443 - ${err.message}`));
    });
  });
};

// @desc    Check single live website TLS certificate
// @route   POST /api/live-certificates/:id/check-live
// @access  Protected
// NOTE: Live check works for ALL statuses - ACTIVE, EXPIRING SOON, EXPIRED, REVOKED.
// The purpose is to see what the real website is serving at port 443 RIGHT NOW.
const checkLiveCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    let cert = await Certificate.findById(id);
    if (!cert) {
      cert = await Certificate.findOne({ certificateId: id });
    }

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found in database.',
      });
    }

    let liveData;
    try {
      liveData = await fetchLiveTlsCertificate(cert.domain);
    } catch (tlsErr) {
      console.error(`Live TLS check failed for ${cert.domain}:`, tlsErr.message);
      return res.status(502).json({
        success: false,
        message: `Live certificate check failed for ${cert.domain}: ${tlsErr.message}`,
      });
    }

    // Determine if certificate changed
    let isChanged = false;
    if (cert.fingerprint256 && cert.fingerprint256.trim()) {
      // Uploaded cert: compare stored fingerprint with live fingerprint
      isChanged =
        cert.fingerprint256.trim().toUpperCase() !==
        liveData.fingerprint256.trim().toUpperCase();
    } else {
      // Manually entered cert: no stored fingerprint yet.
      // Store live fingerprint as the baseline for future comparisons.
      cert.fingerprint256 = liveData.fingerprint256;
      isChanged = false;
    }

    // Update live fields on certificate
    cert.liveCertificateChecked = true;
    cert.liveCertificateLastChecked = new Date();
    cert.liveCertificateSerialNumber = liveData.serialNumber;
    cert.liveCertificateFingerprint256 = liveData.fingerprint256;
    cert.liveCertificateExpiryDate = liveData.expiryDate;
    cert.liveCertificateIssuer = liveData.issuer;
    cert.liveCertificateChanged = isChanged;

    if (!cert.lifecycleHistory) {
      cert.lifecycleHistory = [];
    }

    let historyDescription;
    if (isChanged) {
      historyDescription = `Live check for ${cert.domain} (stored status: ${cert.status}): WARNING - Live certificate fingerprint differs from stored record. Live expiry: ${new Date(liveData.expiryDate).toLocaleDateString()}.`;
    } else {
      historyDescription = `Live check for ${cert.domain} (stored status: ${cert.status}): Certificate matches. Live expiry: ${new Date(liveData.expiryDate).toLocaleDateString()}. Issuer: ${liveData.issuer}.`;
    }

    cert.lifecycleHistory.push({
      action: 'LIVE_CHECK',
      description: historyDescription,
      performedAt: new Date(),
    });

    await cert.save();

    return res.status(200).json({
      success: true,
      message: isChanged
        ? 'Live certificate check finished: Certificate has changed!'
        : 'Live certificate check finished: Certificate matches.',
      changed: isChanged,
      storedCertificate: {
        certificateId: cert.certificateId,
        domain: cert.domain,
        issuer: cert.issuer,
        serialNumber: cert.liveCertificateSerialNumber,
        fingerprint256: cert.fingerprint256,
        expiryDate: cert.expiryDate,
        status: cert.status,
      },
      liveCertificate: {
        domain: cert.domain,
        issuer: liveData.issuer,
        serialNumber: liveData.serialNumber,
        fingerprint256: liveData.fingerprint256,
        expiryDate: liveData.expiryDate,
      },
      certificate: cert,
    });
  } catch (error) {
    console.error('Error in checkLiveCertificate:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while checking live certificate.',
    });
  }
};

// @desc    Check all live certificates in the system
// @route   POST /api/live-certificates/check-all
// @access  Protected
const checkAllLiveCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({});

    let checked = 0;
    let changed = 0;
    let unchanged = 0;
    let failed = 0;
    const results = [];

    // Process all certificates sequentially/gracefully without halting on failure
    for (const cert of certificates) {
      try {
        const liveData = await fetchLiveTlsCertificate(cert.domain, 8000);

        let isChanged = false;
        if (cert.fingerprint256 && cert.fingerprint256.trim()) {
          isChanged =
            cert.fingerprint256.trim().toUpperCase() !==
            liveData.fingerprint256.trim().toUpperCase();
        } else {
          cert.fingerprint256 = liveData.fingerprint256;
          isChanged = false;
        }

        cert.liveCertificateChecked = true;
        cert.liveCertificateLastChecked = new Date();
        cert.liveCertificateSerialNumber = liveData.serialNumber;
        cert.liveCertificateFingerprint256 = liveData.fingerprint256;
        cert.liveCertificateExpiryDate = liveData.expiryDate;
        cert.liveCertificateIssuer = liveData.issuer;
        cert.liveCertificateChanged = isChanged;

        if (!cert.lifecycleHistory) {
          cert.lifecycleHistory = [];
        }

        const historyDesc = isChanged
          ? `Live check: Certificate changed. Stored fingerprint differs from live.`
          : 'Live check: Live certificate matches stored certificate.';

        cert.lifecycleHistory.push({
          action: 'LIVE_CHECK',
          description: historyDesc,
          performedAt: new Date(),
        });

        await cert.save();

        checked++;
        if (isChanged) {
          changed++;
        } else {
          unchanged++;
        }

        results.push({
          certificateId: cert.certificateId,
          domain: cert.domain,
          status: 'SUCCESS',
          changed: isChanged,
        });
      } catch (err) {
        failed++;
        results.push({
          certificateId: cert.certificateId,
          domain: cert.domain,
          status: 'FAILED',
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      summary: {
        total: certificates.length,
        checked,
        changed,
        unchanged,
        failed,
      },
      results,
    });
  } catch (error) {
    console.error('Error checking all certificates:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while checking all live certificates.',
    });
  }
};

module.exports = {
  checkLiveCertificate,
  checkAllLiveCertificates,
};
