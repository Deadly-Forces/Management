const multer = require('multer');
const path = require('path');

const express = require('express');
const { demoLogin, getClaims, getClaimDetails, updateClaimStatus, simulateIngestion, submitClaimantClaim } = require('../controllers/demoController');
const { protect } = require('../middlewares/auth');


const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/') },
  filename: function (req, file, cb) { cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)) }
});
const upload = multer({ storage: storage });

const router = express.Router();
router.post('/login', demoLogin);
router.get('/claims', protect, getClaims);
router.get('/claims/:id', protect, getClaimDetails);

router.put('/claims/:id/status', protect, updateClaimStatus);
router.post('/ingest', protect, simulateIngestion);

router.post('/claims/submit', protect, upload.array('documents', 5), submitClaimantClaim);

module.exports = router;
