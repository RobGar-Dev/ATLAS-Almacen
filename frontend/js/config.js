/* ============================================================
   Almacén ATLAS — configuración compartida del frontend
   Debe cargarse ANTES de index.js / usuario.js / admin.js en
   cada HTML, ya que expone la constante global API_BASE_URL.
   ============================================================ */

// Cuando despliegues a producción, cambia esto por la URL real
// de tu servidor (ej. "https://api.tudominio.com/api").
const API_BASE_URL = 'http://localhost:4000/api';

// Llaves usadas en localStorage para la sesión, centralizadas aquí
// para que index.js, usuario.js y admin.js siempre coincidan.
const ATLAS_STORAGRE_KEYS = {
    token: 'atlas_token',
    usuario: 'atlas_usuario',
    rol: 'atlas_rol',
};