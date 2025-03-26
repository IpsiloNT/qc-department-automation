// server/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.connect()
    .then(() => console.log("✅ Успешное подключение к БД"))
    .catch((err) => console.error("❌ Ошибка подключения к БД:", err));

module.exports = pool;
