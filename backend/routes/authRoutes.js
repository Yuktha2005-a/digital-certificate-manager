const express = require('express');
const router = express.Router();
const { createAdmin, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create-admin', createAdmin);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
