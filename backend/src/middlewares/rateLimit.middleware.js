const rateLimit = require('express-rate-limit');

// Límite general: amortigua abuso básico a nivel de aplicación. La primera
// línea de defensa real contra DoS debe vivir en el proxy/firewall (Caddy,
// fail2ban, el proveedor del VPS), esto es una capa extra, no la única.
const limiteGeneral = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Demasiadas peticiones, intenta de nuevo más tarde' },
});

// Límite estricto solo para login: el objetivo específico es frenar
// fuerza bruta de contraseñas sin bloquear el uso normal del sistema.
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // los intentos exitosos no cuentan contra el límite
    message: { success: false, message: 'Demasiados intentos de inicio de sesión. Espera unos minutos.' },
});

module.exports = { limiteGeneral, limiteLogin };