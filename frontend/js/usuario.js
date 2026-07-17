/* ============================================================
   Almacén ATLAS — lógica de la pantalla de login
   Por ahora las peticiones al backend están simuladas
   (mockRequest). Cuando conectes Node.js + Express + MySQL,
   reemplaza cada bloque marcado con "TODO backend" por tu
   llamada fetch() real al endpoint correspondiente.
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

        // Fuerza el reflow para que la transición de entrada se reproduzca
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

    /* ---------- Modal: Registrar usuario ---------- */
    const registerModal = document.getElementById('register-modal');
    const openRegisterLink = document.getElementById('open-register');

    function openModal() {
        registerModal.classList.add('is-open');
        registerModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const firstInput = registerModal.querySelector('input');
        if (firstInput) firstInput.focus();
    }

    function closeModal() {
        registerModal.classList.remove('is-open');
        registerModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    openRegisterLink.addEventListener('click', (event) => {
        event.preventDefault();
        openModal();
    });

    registerModal.querySelectorAll('[data-close-modal]').forEach((el) => {
        el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && registerModal.classList.contains('is-open')) {
            closeModal();
        }
    });

    /* ---------- Utilidad: simula latencia de red mientras no hay backend ---------- */
    function mockRequest(ms = 1200, shouldFail = false) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                shouldFail ? reject(new Error('Credenciales inválidas')) : resolve();
            }, ms);
        });
    }

    /* ---------- Formulario: Iniciar sesión ---------- */
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = loginForm.querySelector('.btn-primary');
        submitButton.disabled = true;

        const loadingToast = showToast('Iniciando sesión...', 'info', 0);

        const formData = new FormData(loginForm);
        const payload = Object.fromEntries(formData.entries());

        try {
            // TODO backend: reemplazar por tu endpoint real de Express, ej:
            // const response = await fetch('/api/login', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            // });
            // if (!response.ok) throw new Error('Credenciales inválidas');
            // const data = await response.json();

            await mockRequest(1200);

            hideToast(loadingToast);
            showToast('Sesión iniciada correctamente', 'success');

            // TODO backend: redirigir tras un login real, ej:
            // window.location.href = '/dashboard.html';

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Hubo un error al iniciar sesión', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    /* ---------- Formulario: Registrar usuario ---------- */
    const registerForm = document.getElementById('register-form');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = registerForm.querySelector('.btn-primary');
        submitButton.disabled = true;

        const loadingToast = showToast('Registrando usuario...', 'info', 0);

        const formData = new FormData(registerForm);
        const payload = Object.fromEntries(formData.entries());

        try {
            // TODO backend: reemplazar por tu endpoint real de Express, ej:
            // const response = await fetch('/api/register', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            // });
            // if (!response.ok) throw new Error('No se pudo registrar el usuario');

            await mockRequest(1200);

            hideToast(loadingToast);
            showToast('Usuario registrado', 'success');
            registerForm.reset();
            closeModal();

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Hubo un error al registrar el usuario', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

});