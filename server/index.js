const express = require('express');
const app = express();
const testRoute = require('./routes/example.route');

app.use('/api', testRoute);

app.listen(3001, () => {
    console.log('✅ Сервер запущен на порту 3001');
});
