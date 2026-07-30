/* ============================================================
   Almacén ATLAS — lógica de la pantalla de login
   Conectado al backend real: POST /api/auth/login (ver
   API_BASE_URL en config.js, que debe cargarse antes que este
   archivo).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Toasts ---------- */
    const toastContainer = document.getElementById('toast-container');

    /**
     * Muestra un mensaje flotante.
     * @param {string} message - Texto a mostrar.
     * @param {'info'|'success'|'error'} type - Estilo del toast.
     * @param {number} duration - Tiempo visible en ms (0 = no se oculta solo).
     */
    function showToast(message, type = 'info', duration = 3200) {
        if (!toastContainer) {
            console.error('No se encontró #toast-container en el HTML; no se puede mostrar el mensaje:', message);
            return null;
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'status');
        toast.textContent = message;
        toastContainer.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('toast-visible'));

        if (duration > 0) {
            setTimeout(() => hideToast(toast), duration);
        }

        return toast;
    }

    function hideToast(toast) {
        if (!toast) return;
        toast.classList.remove('toast-visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }

    /* ---------- Formulario: Iniciar sesión ---------- */
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = loginForm.querySelector('.btn-primary');
        submitButton.disabled = true;

        const loadingToast = showToast('Iniciando sesión...', 'info', 0);

        const formData = new FormData(loginForm);
        const { username, password } = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // El backend espera "usuario", el input del formulario se
                // llama "username" — se traduce aquí.
                body: JSON.stringify({ usuario: username, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Credenciales inválidas');
            }

            // Guarda la sesión: usuario.js y admin.js leen estas mismas llaves.
            localStorage.setItem(ATLAS_STORAGE_KEYS.token, data.token);
            localStorage.setItem(ATLAS_STORAGE_KEYS.nombre, data.usuario.nombre);
            localStorage.setItem(ATLAS_STORAGE_KEYS.rol, data.usuario.rol);

            hideToast(loadingToast);
            showToast('Sesión iniciada correctamente', 'success');

            const destino = data.usuario.rol === 'administrador'
                ? './pages/admin.html'
                : './pages/usuario.html';

            setTimeout(() => {
                window.location.href = destino;
            }, 600); // deja ver el toast de éxito antes de navegar

        } catch (error) {
            hideToast(loadingToast);

            // Si el fetch ni siquiera llegó al servidor (backend apagado,
            // CORS mal configurado, etc.) el error no trae un mensaje útil
            // del backend, así que se distingue ese caso.
            const mensaje = error instanceof TypeError
                ? 'No se pudo conectar con el servidor. ¿Está corriendo el backend?'
                : error.message;

            showToast(mensaje || 'Hubo un error al iniciar sesión', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

});