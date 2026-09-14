exports.getDashboardData = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: `Welcome to the dashboard. You are isolated in tenant ${req.tenantId}`,
      role: req.user.role,
      metrics: {
        totalClaims: 12,
        pendingReview: 3
      }
    }
  });
};

exports.getAdminSettings = async (req, res) => {
  res.status(200).json({
    success: true,
    data: "Admin settings isolated to this tenant."
  });
};