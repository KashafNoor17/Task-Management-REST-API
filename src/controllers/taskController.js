
const pool = require("../config/db");

// Create a task
async function createTask(req, res, next) {
  try {
    const { project_id, title, description, status, priority, due_date } =
      req.body;

    if (!project_id || !Number.isInteger(Number(project_id)) || Number(project_id) < 1) {
      return res.status(400).json({ error: "Valid project_id is required." });
    }

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Task title is required." });
    }

    const validStatuses = ["pending", "in_progress", "completed"];
    const validPriorities = ["low", "medium", "high"];

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid task status." });
    }

    if (priority !== undefined && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: "Invalid task priority." });
    }

    // Make sure the project belongs to the logged-in user
    const project = await pool.query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
      [Number(project_id), req.user.id]
    );

    if (project.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }

    const result = await pool.query(
      `INSERT INTO tasks
       (project_id, title, description, status, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        Number(project_id),
        title.trim(),
        description || null,
        status || "pending",
        priority || "medium",
        due_date || null,
      ]
    );

    res.status(201).json({
      message: "Task created successfully",
      task: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Get all tasks belonging to the logged-in user

async function getTasks(req, res, next) {
  try {
    const { status, priority, project_id, search } = req.query;

    const validStatuses = ["pending", "in_progress", "completed"];
    const validPriorities = ["low", "medium", "high"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid task status." });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: "Invalid task priority." });
    }

    if (
      project_id &&
      (!Number.isInteger(Number(project_id)) || Number(project_id) < 1)
    ) {
      return res.status(400).json({ error: "Invalid project ID." });
    }

    // Pagination
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;

    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "Page must be at least 1; limit must be between 1 and 100.",
      });
    }

    const allowedSortFields = ["created_at", "due_date", "priority", "title"];
    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = (req.query.order || "desc").toLowerCase();

    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({ error: "Invalid sortBy field." });
    }

    if (!["asc", "desc"].includes(sortOrder)) {
      return res.status(400).json({ error: "Order must be asc or desc." });
    }

    const conditions = ["p.user_id = $1"];
    const values = [req.user.id];

    if (status) {
      values.push(status);
      conditions.push(`t.status = $${values.length}`);
    }

    if (priority) {
      values.push(priority);
      conditions.push(`t.priority = $${values.length}`);
    }

    if (project_id) {
      values.push(Number(project_id));
      conditions.push(`t.project_id = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`t.title ILIKE $${values.length}`);
    }

    const whereClause = conditions.join(" AND ");

    // Count matching tasks before pagination
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE ${whereClause}`,
      values
    );

    const total = countResult.rows[0].total;
    const offset = (page - 1) * limit;

    values.push(limit);
    const limitPosition = values.length;

    values.push(offset);
    const offsetPosition = values.length;

    // sortBy and sortOrder are validated against allowed values
    const result = await pool.query(
      `SELECT t.*, p.name AS project_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE ${whereClause}
       ORDER BY t.${sortBy} ${sortOrder.toUpperCase()} NULLS LAST
       LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
      values
    );

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      tasks: result.rows,
    });
  } catch (error) {
    next(error);
  }
}



// Get one task
async function getTaskById(req, res, next) {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ error: "Invalid task ID." });
    }

    const result = await pool.query(
      `SELECT t.*, p.name AS project_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1 AND p.user_id = $2`,
      [taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

// Update a task
async function updateTask(req, res, next) {
  try {
    const taskId = Number(req.params.id);
    const { title, description, status, priority, due_date } = req.body;

    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ error: "Invalid task ID." });
    }

    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return res.status(400).json({ error: "Task title cannot be empty." });
    }

    const validStatuses = ["pending", "in_progress", "completed"];
    const validPriorities = ["low", "medium", "high"];

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid task status." });
    }

    if (priority !== undefined && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: "Invalid task priority." });
    }

    const result = await pool.query(
      `UPDATE tasks t
       SET title = COALESCE($1, t.title),
           description = COALESCE($2, t.description),
           status = COALESCE($3, t.status),
           priority = COALESCE($4, t.priority),
           due_date = COALESCE($5, t.due_date),
           updated_at = CURRENT_TIMESTAMP
       FROM projects p
       WHERE t.id = $6
         AND t.project_id = p.id
         AND p.user_id = $7
       RETURNING t.*`,
      [
        title === undefined ? null : title.trim(),
        description === undefined ? null : description,
        status === undefined ? null : status,
        priority === undefined ? null : priority,
        due_date === undefined ? null : due_date,
        taskId,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({
      message: "Task updated successfully",
      task: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Delete a task
async function deleteTask(req, res, next) {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId) || taskId < 1) {
      return res.status(400).json({ error: "Invalid task ID." });
    }

    const result = await pool.query(
      `DELETE FROM tasks t
       USING projects p
       WHERE t.id = $1
         AND t.project_id = p.id
         AND p.user_id = $2
       RETURNING t.id`,
      [taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found." });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// Overdue Tasks
async function getOverdueTasks(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT t.*, p.name AS project_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE p.user_id = $1
         AND t.due_date < CURRENT_TIMESTAMP
         AND t.status != 'completed'
       ORDER BY t.due_date ASC`,
      [req.user.id]
    );

    res.json({
      count: result.rows.length,
      tasks: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getOverdueTasks,
};
