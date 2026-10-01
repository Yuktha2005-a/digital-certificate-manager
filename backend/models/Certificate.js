const mongoose = require('mongoose');

const lifecycleHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['CREATED', 'LIVE_CHECK', 'RENEWED', 'REVOKED'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: [true, 'Certificate ID is required'],
      unique: true,
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
    },
    issuer: {
      type: String,
      required: [true, 'Issuer is required'],
      trim: true,
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue Date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry Date is required'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRING SOON', 'EXPIRED', 'REVOKED'],
      default: 'ACTIVE',
    },
    revocationReason: {
      type: String,
      default: '',
      trim: true,
    },
    signatureAlgorithm: {
      type: String,
      default: '',
      trim: true,
    },
    certificateType: {
      type: String,
      default: 'X.509',
      trim: true,
    },
    source: {
      type: String,
      enum: ['UPLOAD', 'MANUAL'],
      default: 'UPLOAD',
    },
    originalFileName: {
      type: String,
      default: '',
      trim: true,
    },
    fingerprint256: {
      type: String,
      default: '',
      trim: true,
    },
    // Live TLS Certificate fields
    liveCertificateChecked: {
      type: Boolean,
      default: false,
    },
    liveCertificateLastChecked: {
      type: Date,
      default: null,
    },
    liveCertificateSerialNumber: {
      type: String,
      default: '',
      trim: true,
    },
    liveCertificateFingerprint256: {
      type: String,
      default: '',
      trim: true,
    },
    liveCertificateExpiryDate: {
      type: Date,
      default: null,
    },
    liveCertificateIssuer: {
      type: String,
      default: '',
      trim: true,
    },
    liveCertificateChanged: {
      type: Boolean,
      default: false,
    },
    // Lifecycle History Array
    lifecycleHistory: {
      type: [lifecycleHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Recalculates and updates the certificate status based on business logic:
 * 1. REVOKED has highest priority
 * 2. If expiryDate < now -> EXPIRED
 * 3. If expiryDate <= now + 30 days -> EXPIRING SOON
 * 4. Otherwise -> ACTIVE
 */
certificateSchema.methods.calculateStatus = function () {
  if (this.status === 'REVOKED') {
    return 'REVOKED';
  }
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  if (expiry.getTime() < now.getTime()) {
    return 'EXPIRED';
  }
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  if (expiry.getTime() - now.getTime() <= thirtyDaysInMs) {
    return 'EXPIRING SOON';
  }
  return 'ACTIVE';
};

// Static helper to compute status given expiryDate and whether it is revoked
certificateSchema.statics.computeStatus = function (expiryDate, isRevoked = false) {
  if (isRevoked) {
    return 'REVOKED';
  }
  const now = new Date();
  const expiry = new Date(expiryDate);
  if (expiry.getTime() < now.getTime()) {
    return 'EXPIRED';
  }
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  if (expiry.getTime() - now.getTime() <= thirtyDaysInMs) {
    return 'EXPIRING SOON';
  }
  return 'ACTIVE';
};

module.exports = mongoose.model('Certificate', certificateSchema);
