const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getCertificates,
  getDashboardStats,
  getCertificateById,
  createCertificate,
  uploadCertificate,
  renewCertificate,
  revokeCertificate,
  deleteCertificate,
} = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer for certificate uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.crt' || ext === '.cer' || ext === '.pem') {
      cb(null, true);
    } else {
      cb(new Error('Only .crt, .cer, and .pem digital certificate files are allowed.'));
    }
  },
});

// Protect all certificate routes
router.use(protect);

router.get('/stats', getDashboardStats);
router.post('/upload', upload.single('certificateFile'), uploadCertificate);

router.route('/')
  .get(getCertificates)
  .post(createCertificate);

router.route('/:id')
  .get(getCertificateById)
  .delete(deleteCertificate);

router.put('/:id/renew', renewCertificate);
router.put('/:id/revoke', revokeCertificate);

module.exports = router;
