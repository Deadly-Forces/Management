const AuditLog = require("../models/AuditLog");

exports.logAction = (action, resourceType) => {
  return async (req, res, next) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await AuditLog.create({
            tenantId: req.tenantId,
            userId: req.user ? req.user._id : null,
            action: action,
            resourceType: resourceType,
            details: {
              method: req.method,
              url: req.originalUrl,
              statusCode: res.statusCode
            }
          });
        } catch (error) {
          console.error("Failed to create audit log", error);
        }
      }
    });
    next();
  };
};