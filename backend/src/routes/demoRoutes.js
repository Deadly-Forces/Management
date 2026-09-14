const express = require('express');
const {
  demoLogin,
  getClaims,
  getMyClaims,
  getClaimDetails,
  updateClaimStatus,
  simulateIngestion,
  submitClaimantClaim
} = require('../controllers/demoController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const router = express.Router();

router.post('/login', demoLogin);
router.get('/claims', protect, getClaims);
router.get('/my-claims', protect, getMyClaims);
router.get('/claims/:id', protect, getClaimDetails);
router.put('/claims/:id/status', protect, updateClaimStatus);
router.post('/ingest', protect, simulateIngestion);

// Hardened submit endpoint with MIME type validation, 10MB limit, and JWT protect
router.post('/claims/submit', protect, upload.array('documents', 5), submitClaimantClaim);

module.exports = router;
