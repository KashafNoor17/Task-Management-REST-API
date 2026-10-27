
const pool = require("../config/db");

async function getDashboardStats(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(t.id)::int AS total_tasks,

         COUNT(t.id) FILTER (
           WHERE t.status = 'pending'
         )::int AS pending_tasks,

         COUNT(t.id) FILTER (
           WHERE t.status = 'in_progress'
         )::int AS in_progress_tasks,

         COUNT(t.id) FILTER (
           WHERE t.status = 'completed'
         )::int AS completed_tasks,

         COUNT(t.id) FILTER (
           WHERE t.due_date < CURRENT_TIMESTAMP
             AND t.status != 'completed'
         )::int AS overdue_tasks

       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       WHERE p.user_id = $1`,
      [req.user.id]
    );

    res.json({
      message: "Dashboard statistics retrieved successfully",
      stats: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboardStats };
