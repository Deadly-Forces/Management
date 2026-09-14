const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const claimRoutes = require("./routes/claimRoutes");
const pipelineRoutes = require("./routes/pipelineRoutes");
const demoRoutes = require("./routes/demoRoutes");

const app = express();

app.use(express.json());
app.use(cors());
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/pipeline", pipelineRoutes);
app.use("/api/demo", demoRoutes);

module.exports = app;