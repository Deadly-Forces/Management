const express = require("express");
const { getDashboardData, getAdminSettings } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middlewares/auth");
const { logAction } = require("../middlewares/audit");

const router = express.Router();

router.use(protect);

router.get("/", logAction('VIEW_DASHBOARD', 'Dashboard'), getDashboardData);
router.get("/settings", authorize('Administrator'), logAction('VIEW_SETTINGS', 'Settings'), getAdminSettings);

module.exports = router;