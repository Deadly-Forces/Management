const express = require("express");
const { uploadMockDocument, triggerPipeline } = require("../controllers/pipelineController");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

// Uploading documents requires Claimant or Agent
router.post("/document", authorize('Claimant', 'Agent', 'Administrator'), uploadMockDocument);

// Triggering processing is usually system-driven, but we expose it for Agents/Admins
router.post("/:claimId/trigger", authorize('Agent', 'Administrator'), triggerPipeline);

module.exports = router;