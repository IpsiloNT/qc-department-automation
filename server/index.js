const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth.route');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes); // <-- Вот здесь

app.listen(3001, () => {
    console.log('✅ Сервер запущен на порту 3001');
});
