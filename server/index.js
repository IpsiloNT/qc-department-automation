const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ СНАЧАЛА middleware
app.use(cors());
app.use(express.json());

// ✅ ПОТОМ маршруты
const authRoutes = require('./routes/auth.route');
const routeCardsRoutes = require('./routes/routeCards.route');
const measureRoutes = require('./routes/measure.route'); // ✅ добавлено

app.use('/api', authRoutes);
app.use('/api', routeCardsRoutes);
app.use('/api', measureRoutes); // ✅ добавлено

app.listen(3001, () => {
    console.log('✅ Сервер запущен на порту 3001');
});
