const express = require('express');
const { login, requestOtp, verifyOtp } = require('../controllers/authController');
const router = express.Router();

router.post('/login', login);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;