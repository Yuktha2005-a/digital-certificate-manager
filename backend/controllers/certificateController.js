const crypto = require('crypto');
const Certificate = require('../models/Certificate');

// Helper to extract Common Name (CN) from Subject or Issuer string
const extractCN = (str) => {
  if (!str) return '';
  const match = str.match(/CN=([^/\n\r,]+)/i);
  return match ? match[1].trim() : '';
};

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

// Helper to sanitize domain
const sanitizeDomain = (domain) => {
  if (!domain) return '';
  return domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim();
};

// Helper to sync status for certificates that are not revoked
const refreshCertificateStatus = async (cert) => {
  if (cert.status === 'REVOKED') return cert;
  const newStatus = cert.calculateStatus();
  if (cert.status !== newStatus) {
    cert.status = newStatus;
    await cert.save();
  }
  return cert;
};

// @desc    Get all certificates (with optional search & status filter)
// @route   GET /api/certificates
// @access  Protected
const getCertificates = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    // Search filter across certificateId, domain, issuer
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { certificateId: searchRegex },
        { domain: searchRegex },
        { issuer: searchRegex },
      ];
    }

    // Status filter
    if (status && status !== 'ALL' && status.trim()) {
      query.status = status.toUpperCase().trim();
    }

    let certificates = await Certificate.find(query).sort({ createdAt: -1 });

    // Ensure status is up-to-date for each retrieved certificate
    const updatedCertificates = await Promise.all(
      certificates.map(async (cert) => {
        // Ensure lifecycleHistory is an array for older records
        if (!cert.lifecycleHistory) {
          cert.lifecycleHistory = [];
        }
        return await refreshCertificateStatus(cert);
      })
    );

    return res.status(200).json({
      success: true,
      count: updatedCertificates.length,
      certificates: updatedCertificates,
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching certificates.',
    });
  }
};

// @desc    Get dashboard statistics and attention-required certificates
// @route   GET /api/certificates/stats
// @access  Protected
const getDashboardStats = async (req, res) => {
  try {
    let certificates = await Certificate.find({});

    // Refresh statuses
    certificates = await Promise.all(
      certificates.map(async (cert) => {
        if (!cert.lifecycleHistory) cert.lifecycleHistory = [];
        return await refreshCertificateStatus(cert);
      })
    );

    const total = certificates.length;
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let revoked = 0;
    let liveChecked = 0;
    let certChanged = 0;
    let notChecked = 0;

    const attentionRequired = [];

    certificates.forEach((cert) => {
      // Status breakdown
      if (cert.status === 'ACTIVE') active++;
      else if (cert.status === 'EXPIRING SOON') expiringSoon++;
      else if (cert.status === 'EXPIRED') expired++;
      else if (cert.status === 'REVOKED') revoked++;

      // Live monitoring breakdown
      if (cert.liveCertificateChecked) {
        liveChecked++;
        if (cert.liveCertificateChanged) {
          certChanged++;
        }
      } else {
        notChecked++;
      }

      // Attention required condition: Expiring Soon, Expired, Revoked, or Live Changed
      if (
        cert.status === 'EXPIRING SOON' ||
        cert.status === 'EXPIRED' ||
        cert.status === 'REVOKED' ||
        cert.liveCertificateChanged
      ) {
        attentionRequired.push(cert);
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        total,
        active,
        expiringSoon,
        expired,
        revoked,
        liveChecked,
        certChanged,
        notChecked,
      },
      attentionRequired,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while calculating dashboard stats.',
    });
  }
};

// @desc    Get single certificate by ID or CertificateId
// @route   GET /api/certificates/:id
// @access  Protected
const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    let cert;

    // Check if valid ObjectId or search by certificateId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      cert = await Certificate.findById(id);
    }

    if (!cert) {
      cert = await Certificate.findOne({ certificateId: id });
    }

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.',
      });
    }

    if (!cert.lifecycleHistory) {
      cert.lifecycleHistory = [];
    }

    cert = await refreshCertificateStatus(cert);

    return res.status(200).json({
      success: true,
      certificate: cert,
    });
  } catch (error) {
    console.error('Error fetching certificate details:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching certificate.',
    });
  }
};

// @desc    Add certificate manually
// @route   POST /api/certificates
// @access  Protected
const createCertificate = async (req, res) => {
  try {
    const { certificateId, domain, issuer, issueDate, expiryDate, signatureAlgorithm } = req.body;

    // Validation: All required fields
    if (!certificateId || !domain || !issuer || !issueDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'All fields (Certificate ID, Domain, Issuer, Issue Date, Expiry Date) are required.',
      });
    }

    const cleanDomain = sanitizeDomain(domain);
    const issueDateTime = new Date(issueDate);
    const expiryDateTime = new Date(expiryDate);

    if (isNaN(issueDateTime.getTime()) || isNaN(expiryDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue date or expiry date format.',
      });
    }

    // Expiry date must be after issue date
    if (expiryDateTime <= issueDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be after issue date.',
      });
    }

    // Unique certificateId validation
    const existing = await Certificate.findOne({ certificateId: certificateId.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Certificate ID already exists. Please provide a unique ID.',
      });
    }

    // Calculate initial status
    const initialStatus = Certificate.computeStatus(expiryDateTime, false);

    // Initial CREATED lifecycle history
    const initialHistory = [
      {
        action: 'CREATED',
        description: 'Certificate was added to the system.',
        performedAt: new Date(),
      },
    ];

    const certificate = await Certificate.create({
      certificateId: certificateId.trim(),
      domain: cleanDomain,
      issuer: issuer.trim(),
      issueDate: issueDateTime,
      expiryDate: expiryDateTime,
      status: initialStatus,
      source: 'MANUAL',
      certificateType: 'X.509',
      signatureAlgorithm: signatureAlgorithm ? signatureAlgorithm.trim() : 'SHA256withRSA',
      lifecycleHistory: initialHistory,
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate created successfully.',
      certificate,
    });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating certificate.',
    });
  }
};

// @desc    Upload and parse actual digital certificate (.crt, .cer, .pem)
// @route   POST /api/certificates/upload
// @access  Protected
const uploadCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No certificate file uploaded. Please upload a .crt, .cer, or .pem file.',
      });
    }

    const originalFileName = req.file.originalname;
    const fileBuffer = req.file.buffer;

    let x509;
    try {
      // Node.js built-in crypto.X509Certificate
      x509 = new crypto.X509Certificate(fileBuffer);
    } catch (parseErr) {
      console.error('X509 parse error:', parseErr.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid certificate format. Ensure the file is a valid X.509 certificate in PEM or DER format.',
      });
    }

    // Extract fields from parsed certificate
    const subject = x509.subject || '';
    const issuerRaw = x509.issuer || '';
    const validFrom = new Date(x509.validFrom);
    const validTo = new Date(x509.validTo);
    const serialNumber = x509.serialNumber || '';
    const fingerprint256 = x509.fingerprint256 || '';

    // Domain resolution:
    // 1. From subject CN
    // 2. From subjectAltName
    // 3. From req.body.domain
    // 4. Fallback to filename without extension
    let parsedDomain = extractCN(subject);
    if (!parsedDomain && x509.subjectAltName) {
      const sanMatch = x509.subjectAltName.match(/DNS:([^\s,]+)/i);
      if (sanMatch) parsedDomain = sanMatch[1];
    }
    if (!parsedDomain && req.body.domain) {
      parsedDomain = req.body.domain;
    }
    if (!parsedDomain) {
      parsedDomain = originalFileName.replace(/\.[^/.]+$/, '');
    }
    parsedDomain = sanitizeDomain(parsedDomain);

    // Issuer resolution
    let parsedIssuer = extractIssuer(issuerRaw);
    if (!parsedIssuer) {
      parsedIssuer = 'X.509 Authority';
    }

    // Certificate ID generation or user input
    let certificateId = req.body.certificateId ? req.body.certificateId.trim() : '';
    if (!certificateId) {
      const cleanPrefix = parsedDomain.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'CERT';
      certificateId = `${cleanPrefix}-${Date.now().toString().slice(-6)}`;
    }

    // Check uniqueness
    const existing = await Certificate.findOne({ certificateId });
    if (existing) {
      certificateId = `${certificateId}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Calculate initial status
    const initialStatus = Certificate.computeStatus(validTo, false);

    // Initial CREATED lifecycle history
    const initialHistory = [
      {
        action: 'CREATED',
        description: `Certificate was added to the system via file upload (${originalFileName}).`,
        performedAt: new Date(),
      },
    ];

    const certificate = await Certificate.create({
      certificateId,
      domain: parsedDomain,
      issuer: parsedIssuer,
      issueDate: validFrom,
      expiryDate: validTo,
      status: initialStatus,
      source: 'UPLOAD',
      certificateType: 'X.509',
      originalFileName,
      fingerprint256,
      liveCertificateSerialNumber: serialNumber,
      signatureAlgorithm: req.body.signatureAlgorithm || 'SHA256withRSA',
      lifecycleHistory: initialHistory,
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate uploaded and parsed successfully.',
      certificate,
    });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while parsing and uploading certificate.',
    });
  }
};

// @desc    Renew certificate with new expiry date
// @route   PUT /api/certificates/:id/renew
// @access  Protected
const renewCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { expiryDate } = req.body;

    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'New expiry date is required for certificate renewal.',
      });
    }

    let cert = await Certificate.findById(id);
    if (!cert) {
      cert = await Certificate.findOne({ certificateId: id });
    }

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.',
      });
    }

    // Revoked certificates cannot be renewed
    if (cert.status === 'REVOKED') {
      return res.status(400).json({
        success: false,
        message: 'Revoked certificates cannot be renewed.',
      });
    }

    const newExpiry = new Date(expiryDate);
    if (isNaN(newExpiry.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expiry date format.',
      });
    }

    // New expiry date must be later than current issue date
    if (newExpiry <= new Date(cert.issueDate)) {
      return res.status(400).json({
        success: false,
        message: 'New expiry date must be later than the current certificate issue date.',
      });
    }

    const prevExpiryStr = new Date(cert.expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const newExpiryStr = newExpiry.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // Update expiry date and recalculate status
    cert.expiryDate = newExpiry;
    cert.status = cert.calculateStatus();

    // Ensure lifecycleHistory is an array
    if (!cert.lifecycleHistory) {
      cert.lifecycleHistory = [];
    }

    cert.lifecycleHistory.push({
      action: 'RENEWED',
      description: `Certificate was renewed. Previous expiry date was ${prevExpiryStr}. New expiry date is ${newExpiryStr}.`,
      performedAt: new Date(),
    });

    await cert.save();

    return res.status(200).json({
      success: true,
      message: 'Certificate renewed successfully.',
      certificate: cert,
    });
  } catch (error) {
    console.error('Error renewing certificate:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while renewing certificate.',
    });
  }
};

// @desc    Revoke certificate
// @route   PUT /api/certificates/:id/revoke
// @access  Protected
const revokeCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const { revocationReason } = req.body;

    let cert = await Certificate.findById(id);
    if (!cert) {
      cert = await Certificate.findOne({ certificateId: id });
    }

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.',
      });
    }

    const reason = revocationReason && revocationReason.trim()
      ? revocationReason.trim()
      : 'Certificate is no longer required.';

    cert.status = 'REVOKED';
    cert.revocationReason = reason;

    if (!cert.lifecycleHistory) {
      cert.lifecycleHistory = [];
    }

    cert.lifecycleHistory.push({
      action: 'REVOKED',
      description: `Certificate was revoked. Reason: ${reason}`,
      performedAt: new Date(),
    });

    await cert.save();

    return res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully.',
      certificate: cert,
    });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while revoking certificate.',
    });
  }
};

// @desc    Delete certificate
// @route   DELETE /api/certificates/:id
// @access  Protected
const deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    let cert = await Certificate.findById(id);
    if (!cert) {
      cert = await Certificate.findOne({ certificateId: id });
    }

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found.',
      });
    }

    await Certificate.findByIdAndDelete(cert._id);

    return res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting certificate.',
    });
  }
};

module.exports = {
  getCertificates,
  getDashboardStats,
  getCertificateById,
  createCertificate,
  uploadCertificate,
  renewCertificate,
  revokeCertificate,
  deleteCertificate,
};
