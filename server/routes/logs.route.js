const express = require('express');
const router = express.Router();
const pool = require('../db');

// 📥 Получить логи с фильтрацией, сортировкой и пагинацией
router.get('/admin/logs', async (req, res) => {
    const {
        user, entity, action, status, ip, method,
        date_from, date_to, page = 1, pageSize = 20, sort = 'timestamp', order = 'desc'
    } = req.query;

    const offset = (page - 1) * pageSize;
    const params = [];
    const where = [];

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
    if (status) {
        params.push(status);
        where.push(`sl.status_code = $${params.length}`);
    }
    if (ip) {
        params.push(ip);
        where.push(`sl.ip_address::text ILIKE $${params.length}`);
    }
    if (method) {
        params.push(method);
        where.push(`sl.request_method = $${params.length}`);
    }
    if (date_from) {
        params.push(date_from);
        where.push(`sl.timestamp >= $${params.length}`);
    }
    if (date_to) {
        params.push(date_to);
        where.push(`sl.timestamp <= $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const baseQuery = `
        FROM system_log sl
        LEFT JOIN users u ON u.user_id = sl.user_id
        LEFT JOIN role r ON r.role_id = sl.role_id
        ${whereClause}
    `;

    try {
        const logs = await pool.query(`
            SELECT sl.*, u.login, r.name AS role
            ${baseQuery}
            ORDER BY ${sort} ${order}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, pageSize, offset]);

        const totalCount = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);

        res.json({
            data: logs.rows,
            total: parseInt(totalCount.rows[0].count),
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        });
    } catch (err) {
        console.error('Ошибка при получении логов:', err);
        res.status(500).json({ message: 'Ошибка сервера при загрузке логов' });
    }
});

// 📊 Получить статистику по логам
router.get('/admin/logs/stats', async (_req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status_code >= 400) AS errors,
                COUNT(*) FILTER (WHERE action = 'login' AND status_code = 200) AS successful_logins,
                COUNT(*) FILTER (WHERE action = 'login' AND status_code = 401) AS failed_logins,
                COUNT(DISTINCT ip_address) AS unique_ips
            FROM system_log
        `);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ошибка при получении статистики:', err);
        res.status(500).json({ message: 'Ошибка сервера при получении статистики' });
    }
});

module.exports = router;
