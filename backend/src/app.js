const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const rutas = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// En desarrollo, Live Server (u otras herramientas) pueden servir el
// frontend desde "localhost" o "127.0.0.1", y en distintos puertos según
// la configuración de cada quien — para el navegador son orígenes
// distintos, aunque apunten a la misma máquina. Se acepta una lista
// separada por comas en CORS_ORIGIN (ej. "http://localhost:5500,http://127.0.0.1:5500"),
// o cualquier origen local si no se define nada.
const origenesPermitidos = (process.env.CORS_ORIGIN || 'http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .map((origen) => origen.trim());

app.use(cors({
    origin(origen, callback) {
        // Peticiones sin header Origin (ej. Postman, curl) siempre se permiten.
        if (!origen || origenesPermitidos.includes(origen)) {
            callback(null, true);
        } else {
            callback(new Error(`Origen no permitido por CORS: ${origen}`));
        }
    },
}));
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