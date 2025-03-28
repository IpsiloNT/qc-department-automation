const express = require('express');
const router = express.Router();
const pool = require('../db');

// 📌 Получить всех пользователей с полными данными
router.get('/admin/users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.user_id,
                u.login,
                u.password,
                u.role_id,
                r.name AS role,
                e.first_name,
                e.last_name,
                e.patronymic,
                e.position
            FROM users u
            JOIN role r ON u.role_id = r.role_id
            LEFT JOIN employee e ON e.user_id = u.user_id
            ORDER BY u.user_id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении пользователей:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// 📌 Получить список всех ролей
router.get('/admin/roles', async (req, res) => {
    try {
        const result = await pool.query(`SELECT role_id, name FROM role ORDER BY role_id`);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении ролей:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// 📌 Обновить данные пользователя (логин, роль, ФИО, должность)
router.put('/admin/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const { login, role, fullName, position } = req.body;

    try {
        if (!login || !role || !fullName || !position) {
            return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
        }

        const nameParts = fullName.trim().split(' ');
        if (nameParts.length < 2) {
            return res.status(400).json({ message: 'ФИО должно содержать как минимум фамилию и имя' });
        }

        const [last_name, first_name, ...rest] = nameParts;
        const patronymic = rest.join(' ') || null;

        // Найти role_id по названию роли
        const roleResult = await pool.query(`SELECT role_id FROM role WHERE name = $1`, [role]);
        if (roleResult.rows.length === 0) {
            return res.status(400).json({ message: 'Роль не найдена' });
        }
        const role_id = roleResult.rows[0].role_id;

        // Обновить логин и роль
        await pool.query(
            `UPDATE users SET login = $1, role_id = $2 WHERE user_id = $3`,
            [login, role_id, userId]
        );

        // Обновить или вставить в employee
        await pool.query(`
            INSERT INTO employee (user_id, last_name, first_name, patronymic, position)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id) DO UPDATE SET
                last_name = EXCLUDED.last_name,
                first_name = EXCLUDED.first_name,
                patronymic = EXCLUDED.patronymic,
                position = EXCLUDED.position
        `, [userId, last_name, first_name, patronymic, position]);

        res.json({ message: 'Пользователь обновлён' });
    } catch (err) {
        console.error('Ошибка при обновлении пользователя:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// 📌 Сбросить пароль пользователю
router.put('/admin/users/:userId/reset-password', async (req, res) => {
    const { userId } = req.params;
    const defaultPassword = '123456';

    try {
        await pool.query(
            `UPDATE users SET password = $1 WHERE user_id = $2`,
            [defaultPassword, userId]
        );
        res.json({ message: 'Пароль сброшен до значения "123456"' });
    } catch (err) {
        console.error('Ошибка при сбросе пароля:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// 📌 Удалить пользователя
router.delete('/admin/users/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        await pool.query(`DELETE FROM users WHERE user_id = $1`, [userId]);
        res.json({ message: 'Пользователь удалён' });
    } catch (err) {
        console.error('Ошибка при удалении пользователя:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
