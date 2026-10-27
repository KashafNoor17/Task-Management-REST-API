
const pool = require("../config/db");

// Create a project
async function createProject(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        error: "Project name is required.",
      });
    }

    const result = await pool.query(
      `INSERT INTO projects (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, description, created_at`,
      [req.user.id, name.trim(), description || null]
    );

    res.status(201).json({
      message: "Project created successfully",
      project: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Get all projects belonging to the logged-in user
async function getProjects(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, user_id, name, description, created_at
       FROM projects
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ projects: result.rows });
  } catch (error) {
    next(error);
  }
}

// Get one project belonging to the logged-in user
async function getProjectById(req, res, next) {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId < 1) {
      return res.status(400).json({ error: "Invalid project ID." });
    }

    const result = await pool.query(
      `SELECT id, user_id, name, description, created_at
       FROM projects
       WHERE id = $1 AND user_id = $2`,
      [projectId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json({ project: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

// Update a project
async function updateProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const { name, description } = req.body;

    if (!Number.isInteger(projectId) || projectId < 1) {
      return res.status(400).json({ error: "Invalid project ID." });
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({ error: "Project name cannot be empty." });
    }

    const result = await pool.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           description = COALESCE($2, description)
       WHERE id = $3 AND user_id = $4
       RETURNING id, user_id, name, description, created_at`,
      [
        name === undefined ? null : name.trim(),
        description === undefined ? null : description,
        projectId,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json({
      message: "Project updated successfully",
      project: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Delete a project
async function deleteProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId < 1) {
      return res.status(400).json({ error: "Invalid project ID." });
    }

    const result = await pool.query(
      `DELETE FROM projects
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [projectId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
