const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const rutas = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'ATLAS API activa' }));

app.use('/api', rutas);

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Siempre al final: captura los errores de todas las rutas anteriores
app.use(errorMiddleware);

module.exports = app;
