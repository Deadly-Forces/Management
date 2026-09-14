const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const multer = require("multer");

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const claimRoutes = require("./routes/claimRoutes");
const pipelineRoutes = require("./routes/pipelineRoutes");
const demoRoutes = require("./routes/demoRoutes");

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting: 100 requests per 15 minutes window
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes."
  }
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(cors());

// Static uploads serving
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/pipeline", pipelineRoutes);
app.use("/api/demo", demoRoutes);

// Multer and general error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File exceeds 10MB limit." });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err && err.code === "INVALID_MIME_TYPE") {
    return res.status(400).json({ error: err.message });
  } else if (err && err.message && err.message.includes("Corrupted")) {
    return res.status(400).json({ error: "Corrupted or invalid PDF file" });
  }

  if (err) {
    return res.status(err.status || 500).json({ error: err.message || "Internal server error" });
  }
  next();
});

module.exports = app;