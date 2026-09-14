const mongoose = require("mongoose");
const auditLogSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resourceType: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});
auditLogSchema.index({ tenantId: 1, timestamp: -1 });
module.exports = mongoose.model("AuditLog", auditLogSchema);