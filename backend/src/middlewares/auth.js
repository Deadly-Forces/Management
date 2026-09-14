const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    const userId = decoded.userId || decoded.id || decoded.claimantId;
    req.user = await User.findById(userId).select("-password");
    if (!req.user) return res.status(401).json({ success: false, message: "User not found" });
    
    req.userId = req.user._id;
    req.tenantId = req.user.tenantId.toString();
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token failed or expired" });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};