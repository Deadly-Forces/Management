const express = require("express");
const { 
  createClaim, 
  getClaimDetails, 
  transitionStatus, 
  assignClaim 
} = require("../controllers/claimController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.post("/", authorize('Claimant', 'Agent', 'Administrator'), createClaim);
router.get("/:id", getClaimDetails);

// Only specific roles can transition statuses beyond DRAFT/SUBMITTED
router.put("/:id/transition", authorize('Agent', 'Human_Verifier', 'Administrator', 'Claimant'), transitionStatus);

router.put("/:id/assign", authorize('Agent', 'Administrator'), assignClaim);

module.exports = router;