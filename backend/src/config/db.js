const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones: reutiliza conexiones en vez de abrir una nueva
// por cada consulta, que es lo recomendado para una API REST.
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Evita que mysql2 convierta DATE/DATETIME a objetos Date de JS
    // (que arrastran zona horaria) — mejor recibirlos como texto plano
    // y formatearlos explícitamente donde se necesiten.
    dateStrings: true,
});

module.exports = pool;