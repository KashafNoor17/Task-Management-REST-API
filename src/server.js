
require("dotenv").config();

const express = require("express");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const authenticateToken = require("./middleware/authMiddleware");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Task Management API is running",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS server_time");

    res.json({
      status: "healthy",
      database: "connected",
      serverTime: result.rows[0].server_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.use((err, req, res, next) => {
  console.error("API error:", err.message);

  if (err.code === "23505") {
    return res.status(409).json({
      error: "This record already exists.",
    });
  }

  res.status(500).json({
    error: "Internal server error",
  });
});
app.get("/api/protected", authenticateToken, (req, res) => {
  res.json({
    message: "You accessed a protected route successfully!",
    userId: req.user.id,
  });
});
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
