const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const rutas = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');
const { limiteGeneral } = require('./middlewares/rateLimit.middleware');

const app = express();

// El backend vive detrás de un proxy reverso (Caddy en Docker) que nunca
// se apaga en producción. Sin esto, Express ve la IP del proxy en vez de
// la del cliente real — rompe el rate limiting y cualquier log por IP.
app.set('trust proxy', 1);

// Quita la cabecera "X-Powered-By: Express" — Helmet ya lo hace, pero se
// deja explícito: no hay razón para anunciar la tecnología del backend
// a quien esté tanteando el sistema desde afuera.
app.disable('x-powered-by');

app.use(helmet());

// En desarrollo, Live Server (u otras herramientas) pueden servir el
// frontend desde "localhost" o "127.0.0.1", y en distintos puertos según
// la configuración de cada quien — para el navegador son orígenes
// distintos, aunque apunten a la misma máquina. Se acepta una lista
// separada por comas en CORS_ORIGIN (ej. "http://localhost:5500,http://127.0.0.1:5500"),
// o cualquier origen local si no se define nada.
//
// En producción (detrás de Caddy) frontend y backend quedan en el MISMO
// origen, así que CORS_ORIGIN debería apuntar solo a tu dominio real —
// revisa el .env de producción.
const origenesPermitidos = (process.env.CORS_ORIGIN || 'http://localhost:5500,http://127.0.0.1:5500')
    .split(',')
    .map((origen) => origen.trim());

app.use(cors({
    origin(origen, callback) {
        // Peticiones sin header Origin (ej. Postman, curl, o el propio
        // proxy interno) siempre se permiten.
        if (!origen || origenesPermitidos.includes(origen)) {
            callback(null, true);
        } else {
            callback(new Error(`Origen no permitido por CORS: ${origen}`));
        }
    },
}));

app.use(express.json({ limit: '100kb' })); // límite de tamaño: nadie necesita mandar más de eso a esta API
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'ATLAS API activa' }));

// Límite de peticiones a nivel de aplicación — ver rateLimit.middleware.js.
// No sustituye un firewall/WAF, es una capa adicional. Se aplica después
// de /health a propósito, para que los healthchecks de Docker (que pegan
// cada pocos segundos) nunca cuenten contra el límite de nadie más.
app.use('/api', limiteGeneral);

app.use('/api', rutas);

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Siempre al final: captura los errores de todas las rutas anteriores
app.use(errorMiddleware);

module.exports = app;