
const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getOverdueTasks,
} = require("../controllers/taskController");


// Protect every task route
router.use(authenticateToken);

router.post("/", createTask);
router.get("/", getTasks);
router.get("/overdue", getOverdueTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
