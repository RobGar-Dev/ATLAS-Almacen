/* ============================================================
   Almacén ATLAS — configuración compartida del frontend
   Debe cargarse ANTES de index.js / usuario.js / admin.js en
   cada HTML, ya que expone la constante global API_BASE_URL.
   ============================================================ */

// En desarrollo local (Live Server en :5500) el frontend y el backend
// viven en orígenes distintos, así que hace falta la URL completa.
// En producción, Caddy sirve el frontend y hace de proxy de /api en el
// MISMO origen — ahí basta una ruta relativa, y de paso ni siquiera
// hace falta CORS. Se detecta automáticamente para no tener que tocar
// este archivo a mano en cada despliegue.
const API_BASE_URL = (() => {
    const esDevLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname)
        && window.location.port === '5500';

    return esDevLocal ? 'http://localhost:4000/api' : '/api';
})();

// Correo al que se dirige la requisición de compras por defecto — el
// vendedor puede cambiarlo en el momento desde el modal, esto solo
// precarga el campo. Cámbialo por el correo real de tu área de compras.
const CORREO_COMPRAS_DESTINO_DEFAULT = 'compras@tuempresa.com';

// Llaves usadas en localStorage para la sesión, centralizadas aquí
// para que index.js, usuario.js y admin.js siempre coincidan.
const ATLAS_STORAGE_KEYS = {
    token: 'atlas_token',
    nombre: 'atlas_usuario',
    rol: 'atlas_rol',
};