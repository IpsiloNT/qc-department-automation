const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/route-cards', async (req, res) => {
    try {
        const result = await pool.query(`
          SELECT 
    rc.route_card_number,
    rc.date,
    rc.order_number,
    rc.close_date,
    rc.quantity,
    COALESCE(
        json_agg(
            jsonb_build_object(
                'drawing_number', ds.drawing_number,
                'name', ds.name,
                'number', df.number,
                'year_letter', df.year_letter,
                'diameter', df.diameter,
                'width', df.width,
                'height', df.height,
                'weight', df.weight,
                'status', ist.name
            )
        ) FILTER (WHERE ds.drawing_number IS NOT NULL),
        '[]'
    ) AS details
FROM route_card rc
LEFT JOIN detail_fact df ON df.route_card_number = rc.route_card_number
LEFT JOIN detail_specification ds ON ds.detail_id = df.detail_id
LEFT JOIN inspection_status ist ON ist.status_id = df.status_id
GROUP BY rc.route_card_number, rc.date, rc.order_number, rc.close_date, rc.quantity
ORDER BY rc.date DESC;

        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка при получении маршрутных карт:', err);
        res.status(500).json({ message: 'Ошибка сервера при загрузке маршрутных карт' });
    }
});

module.exports = router;
