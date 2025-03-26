const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    try {
        const query = `
            SELECT u.user_id, u.login, u.password, u.role_id, r.name AS role
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            WHERE u.login = $1 AND u.password = $2
        `;

        const result = await pool.query(query, [username, password]);

        if (result.rows.length === 0) {
            // 🔴 Неуспешная попытка входа — логируем
            await pool.query(`
                INSERT INTO system_log (
                    action, request_method, status_code,
                    ip_address, user_agent, description
                ) VALUES (
                    'login', $1, $2, $3, $4, $5
                )
            `, [
                req.method,
                401,
                clientIp,
                userAgent,
                `Неуспешная попытка входа для логина "${username}"`
            ]);

            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        const user = result.rows[0];

        // ✅ Успешный вход — логируем
        await pool.query(`
            INSERT INTO system_log (
                user_id, role_id, action,
                request_method, status_code,
                ip_address, user_agent, description
            ) VALUES (
                $1, $2, 'login',
                $3, $4,
                $5, $6, $7
            )
        `, [
            user.user_id,
            user.role_id,
            req.method,
            200,
            clientIp,
            userAgent,
            `Успешный вход пользователя "${username}"`
        ]);

        res.json({
            userId: user.user_id,
            login: user.login,
            role: user.role
        });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        return res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;
