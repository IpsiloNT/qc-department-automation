// server/routes/logs.route.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/admin/logs', async (req, res) => {
    const { user, entity, action, date_from, date_to } = req.query;
    const params = [];
    let where = [];

    if (user) {
        params.push(`%${user}%`);
        where.push(`u.login ILIKE $${params.length}`);
    }

    if (entity) {
        params.push(entity);
        where.push(`sl.entity = $${params.length}`);
    }

    if (action) {
        params.push(action);
        where.push(`sl.action = $${params.length}`);
    }

    if (date_from) {
        params.push(date_from);
        where.push(`sl.timestamp >= $${params.length}`);
    }

    if (date_to) {
        params.push(date_to);
        where.push(`sl.timestamp <= $${params.length}`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const result = await pool.query(`
        SELECT sl.*, u.login, r.name AS role_name
        FROM system_log sl
        LEFT JOIN users u ON sl.user_id = u.user_id
        LEFT JOIN role r ON sl.role_id = r.role_id
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT 1000
    `, params);

    res.json(result.rows);
});

module.exports = router;
