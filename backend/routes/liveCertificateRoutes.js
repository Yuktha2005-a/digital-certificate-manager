const express = require('express');
const router = express.Router();
const {
  checkLiveCertificate,
  checkAllLiveCertificates,
} = require('../controllers/liveCertificateController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/check-all', checkAllLiveCertificates);
router.post('/:id/check-live', checkLiveCertificate);

module.exports = router;
