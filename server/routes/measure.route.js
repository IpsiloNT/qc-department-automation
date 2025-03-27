const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/measure', async (req, res) => {
    const {
        number, year_letter, diameter, width, height, thickness, weight
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE detail_fact
             SET diameter = $3,
                 width = $4,
                 height = $5,
                 thickness = $6,
                 weight = $7
             WHERE number = $1 AND year_letter = $2`,
            [number, year_letter, diameter, width, height, thickness, weight]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Деталь не найдена' });
        }

        res.json({ message: 'Замеры обновлены' });
    } catch (error) {
        console.error('Ошибка при обновлении замеров:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

module.exports = router;
