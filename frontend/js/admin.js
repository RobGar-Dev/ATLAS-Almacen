//admin.js
/* ============================================================
   Almacén ATLAS — panel de administrador
   Los datos están simulados (mockRequest + arreglos locales).
   Cuando conectes Node.js + Express + MySQL, reemplaza cada
   bloque marcado con "TODO backend" por tu llamada fetch() real.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Toasts ---------- */
    const toastContainer = document.getElementById('toast-container');

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

    /* ---------- Utilidad: simula latencia de red mientras no hay backend ---------- */
    function mockRequest(ms = 900, shouldFail = false) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                shouldFail ? reject(new Error('Fallo simulado')) : resolve();
            }, ms);
        });
    }

    /* ---------- Sesión ---------- */

    // TODO backend: reemplazar por el admin real devuelto al iniciar sesión
    const nombreAdminEl = document.getElementById('nombre-admin');
    nombreAdminEl.textContent = localStorage.getItem('atlas_usuario') || 'Administrador';

    /* ============================================================
       Navegación entre secciones
       ============================================================ */

    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');

    navItems.forEach((btn) => {
        btn.addEventListener('click', () => {
            navItems.forEach((b) => b.classList.remove('is-active'));
            sections.forEach((s) => s.classList.remove('is-active'));

            btn.classList.add('is-active');
            document.getElementById(`section-${btn.dataset.section}`).classList.add('is-active');
        });
    });

    /* ============================================================
       Niveles de stock (mismos umbrales que la vista de usuario)
       ============================================================ */

    const STOCK_ALTO_LIMITE = 30;
    const STOCK_MEDIO_LIMITE = 15;

    function obtenerNivelStock(stock) {
        if (stock >= STOCK_ALTO_LIMITE) return 'alto';
        if (stock >= STOCK_MEDIO_LIMITE) return 'medio';
        return 'bajo';
    }

    /* ============================================================
       Datos simulados
       ============================================================ */

    // TODO backend: reemplazar por GET /api/productos
    let productos = [
        { codigo: 'A-001', nombre: 'Cable THHW 12 AWG', categoria: 'Cableado', stock: 42 },
        { codigo: 'A-014', nombre: 'Interruptor termomagnético 2P', categoria: 'Protecciones', stock: 3 },
        { codigo: 'A-027', nombre: 'Contactor 40A', categoria: 'Control', stock: 8 },
        { codigo: 'A-033', nombre: 'Charola metálica 4"', categoria: 'Cableado', stock: 20 },
        { codigo: 'A-041', nombre: 'Relevador térmico 32A', categoria: 'Protecciones', stock: 12 },
        { codigo: 'A-052', nombre: 'PLC modular 16E/16S', categoria: 'Control', stock: 5 },
    ];

    // TODO backend: reemplazar por GET /api/usuarios
    let usuarios = [
        { id: 1, nombre: 'Ana Torres', usuario: 'ana.torres', rol: 'administrador', activo: true },
        { id: 2, nombre: 'Luis Peña', usuario: 'luis.pena', rol: 'vendedor', activo: true },
        { id: 3, nombre: 'Marco Ruiz', usuario: 'marco.ruiz', rol: 'vendedor', activo: false },
    ];

    // TODO backend: reemplazar por GET /api/movimientos?dias=7
    const movimientosSemana = [
        { dia: 'Lun', entradas: 12, salidas: 8 },
        { dia: 'Mar', entradas: 6, salidas: 10 },
        { dia: 'Mié', entradas: 18, salidas: 4 },
        { dia: 'Jue', entradas: 9, salidas: 14 },
        { dia: 'Vie', entradas: 22, salidas: 11 },
        { dia: 'Sáb', entradas: 3, salidas: 6 },
        { dia: 'Dom', entradas: 0, salidas: 2 },
    ];

    let siguienteIdUsuario = usuarios.length + 1;

    /* ============================================================
       Dashboard: KPIs
       ============================================================ */

    function renderKpis() {
        document.getElementById('kpi-total-productos').textContent = productos.length;
        document.getElementById('kpi-total-piezas').textContent =
            productos.reduce((acc, p) => acc + p.stock, 0).toLocaleString('es-MX');
        document.getElementById('kpi-stock-bajo').textContent =
            productos.filter((p) => obtenerNivelStock(p.stock) === 'bajo').length;
        document.getElementById('kpi-usuarios-activos').textContent =
            usuarios.filter((u) => u.activo).length;
    }

    /* ============================================================
       Dashboard: gráficas (Chart.js)
       ============================================================ */

    let chartStockNivel, chartCategorias, chartMovimientos;

    const paletaChart = {
        volt: '#4b3df0',
        voltSoft: '#8b7fff',
        coral: '#ff5470',
        mint: '#17b890',
        amber: '#f5a524',
        rose: '#e0264f',
        ink: '#12121c',
        grid: '#e2e5f0',
    };

    Chart.defaults.font.family = "'Inter', 'Manrope', sans-serif";
    Chart.defaults.color = '#6b6d85';

    function renderCharts() {
        const nivelCounts = { alto: 0, medio: 0, bajo: 0 };
        productos.forEach((p) => nivelCounts[obtenerNivelStock(p.stock)]++);

        const categorias = [...new Set(productos.map((p) => p.categoria))];
        const stockPorCategoria = categorias.map((cat) =>
            productos.filter((p) => p.categoria === cat).reduce((acc, p) => acc + p.stock, 0)
        );

        // ---- Doughnut: distribución de stock ----
        const ctxNivel = document.getElementById('chart-stock-nivel');
        if (chartStockNivel) chartStockNivel.destroy();
        chartStockNivel = new Chart(ctxNivel, {
            type: 'doughnut',
            data: {
                labels: ['Alto', 'Medio', 'Bajo'],
                datasets: [{
                    data: [nivelCounts.alto, nivelCounts.medio, nivelCounts.bajo],
                    backgroundColor: [paletaChart.mint, paletaChart.amber, paletaChart.rose],
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16 } },
                },
            },
        });

        // ---- Barras: productos por categoría ----
        const ctxCategorias = document.getElementById('chart-categorias');
        if (chartCategorias) chartCategorias.destroy();
        chartCategorias = new Chart(ctxCategorias, {
            type: 'bar',
            data: {
                labels: categorias,
                datasets: [{
                    label: 'Piezas',
                    data: stockPorCategoria,
                    backgroundColor: paletaChart.volt,
                    borderRadius: 6,
                    maxBarThickness: 40,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: paletaChart.grid }, beginAtZero: true },
                },
            },
        });

        // ---- Línea: movimientos últimos 7 días ----
        const ctxMovimientos = document.getElementById('chart-movimientos');
        if (chartMovimientos) chartMovimientos.destroy();
        chartMovimientos = new Chart(ctxMovimientos, {
            type: 'line',
            data: {
                labels: movimientosSemana.map((m) => m.dia),
                datasets: [
                    {
                        label: 'Entradas',
                        data: movimientosSemana.map((m) => m.entradas),
                        borderColor: paletaChart.mint,
                        backgroundColor: 'rgba(23, 184, 144, 0.12)',
                        tension: 0.35,
                        fill: true,
                    },
                    {
                        label: 'Salidas',
                        data: movimientosSemana.map((m) => m.salidas),
                        borderColor: paletaChart.coral,
                        backgroundColor: 'rgba(255, 84, 112, 0.10)',
                        tension: 0.35,
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16 } } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: paletaChart.grid }, beginAtZero: true },
                },
            },
        });
    }

    function renderDashboard() {
        renderKpis();
        renderCharts();
    }

    renderDashboard();

    const actualizarDashboardBtn = document.getElementById('actualizar-dashboard-btn');
    actualizarDashboardBtn.addEventListener('click', async () => {
        actualizarDashboardBtn.disabled = true;
        const loadingToast = showToast('Actualizando dashboard...', 'info', 0);

        try {
            // TODO backend: reemplazar por tus endpoints reales de resumen, ej:
            // const [productosRes, usuariosRes, movimientosRes] = await Promise.all([
            //     fetch('/api/productos'), fetch('/api/usuarios'), fetch('/api/movimientos?dias=7')
            // ]);

            await mockRequest();

            renderDashboard();
            hideToast(loadingToast);
            showToast('Dashboard actualizado', 'success');
        } catch (error) {
            hideToast(loadingToast);
            showToast('Ocurrió un error al actualizar el dashboard', 'error');
        } finally {
            actualizarDashboardBtn.disabled = false;
        }
    });

    /* ============================================================
       Modales genéricos
       ============================================================ */

    function openModal(modal) {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const firstInput = modal.querySelector('input, select, button.btn-primary');
        if (firstInput) firstInput.focus();
    }

    function closeModal(modal) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.modal').forEach((modal) => {
        modal.querySelectorAll('[data-close-modal]').forEach((el) => {
            el.addEventListener('click', () => closeModal(modal));
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        document.querySelectorAll('.modal.is-open').forEach((modal) => closeModal(modal));
    });

    /* ============================================================
       Usuarios: render + filtro
       ============================================================ */

    const cuerpoTablaUsuarios = document.getElementById('cuerpo-tabla-usuarios');
    const usuariosVacioRow = document.getElementById('usuarios-vacio-row');
    const filtroUsuarios = document.getElementById('filtro-usuarios');

    const etiquetaRol = { administrador: 'Administrador', vendedor: 'Vendedor' };

    function obtenerUsuariosFiltrados() {
        const busqueda = filtroUsuarios.value.trim().toLowerCase();
        if (!busqueda) return usuarios;
        return usuarios.filter((u) =>
            u.nombre.toLowerCase().includes(busqueda) || u.usuario.toLowerCase().includes(busqueda)
        );
    }

    function renderTablaUsuarios() {
        cuerpoTablaUsuarios.querySelectorAll('tr:not(#usuarios-vacio-row)').forEach((row) => row.remove());

        const lista = obtenerUsuariosFiltrados();

        if (lista.length === 0) {
            usuariosVacioRow.style.display = '';
            usuariosVacioRow.querySelector('td').textContent = usuarios.length === 0
                ? 'Aún no hay usuarios registrados.'
                : 'Ningún usuario coincide con la búsqueda.';
            return;
        }

        usuariosVacioRow.style.display = 'none';

        lista.forEach((usuario) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${usuario.usuario}</td>
                <td>${usuario.nombre}</td>
                <td><span class="badge badge-rol-${usuario.rol}">${etiquetaRol[usuario.rol]}</span></td>
                <td>
                    <span class="badge badge-estado-${usuario.activo ? 'activo' : 'inactivo'}">
                        ${usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="fila-acciones">
                        <button type="button" class="btn-icono" data-accion="estado" data-id="${usuario.id}">
                            ${usuario.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button type="button" class="btn-icono" data-accion="editar" data-id="${usuario.id}">Editar</button>
                        <button type="button" class="btn-icono btn-icono-danger" data-accion="eliminar" data-id="${usuario.id}">Eliminar</button>
                    </div>
                </td>
            `;
            cuerpoTablaUsuarios.appendChild(row);
        });
    }

    filtroUsuarios.addEventListener('input', renderTablaUsuarios);
    renderTablaUsuarios();

    cuerpoTablaUsuarios.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-accion]');
        if (!btn) return;

        const id = Number(btn.dataset.id);
        const usuario = usuarios.find((u) => u.id === id);
        if (!usuario) return;

        if (btn.dataset.accion === 'editar') abrirEditarUsuario(usuario);
        if (btn.dataset.accion === 'eliminar') abrirEliminarUsuario(usuario);
        if (btn.dataset.accion === 'estado') cambiarEstadoUsuario(usuario);
    });

    /* ---------- Registrar usuario ---------- */

    const nuevoUsuarioModal = document.getElementById('nuevo-usuario-modal');
    const nuevoUsuarioForm = document.getElementById('nuevo-usuario-form');

    document.getElementById('open-nuevo-usuario').addEventListener('click', () => openModal(nuevoUsuarioModal));

    nuevoUsuarioForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = nuevoUsuarioForm.querySelector('.btn-primary');
        submitButton.disabled = true;
        const loadingToast = showToast('Registrando usuario...', 'info', 0);

        const formData = new FormData(nuevoUsuarioForm);
        const payload = Object.fromEntries(formData.entries());

        if (usuarios.some((u) => u.usuario === payload.usuario)) {
            hideToast(loadingToast);
            showToast('Ocurrió un error con el registro: el usuario ya existe', 'error');
            submitButton.disabled = false;
            return;
        }

        try {
            // TODO backend: reemplazar por tu endpoint real de Express, ej:
            // const response = await fetch('/api/usuarios', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload) // la contraseña debe hashearse en el servidor (bcrypt)
            // });
            // if (!response.ok) throw new Error('No se pudo registrar el usuario');
            // const nuevoUsuario = await response.json();

            await mockRequest();

            usuarios.push({
                id: siguienteIdUsuario++, // TODO backend: usar el id devuelto por MySQL
                nombre: payload.nombre,
                usuario: payload.usuario,
                rol: payload.rol,
                activo: true,
            });

            renderTablaUsuarios();
            renderKpis();

            hideToast(loadingToast);
            showToast('Registro exitoso', 'success');
            nuevoUsuarioForm.reset();
            closeModal(nuevoUsuarioModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast('Ocurrió un error con el registro', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    /* ---------- Editar usuario ---------- */

    const editarUsuarioModal = document.getElementById('editar-usuario-modal');
    const editarUsuarioForm = document.getElementById('editar-usuario-form');
    const euIdOriginal = document.getElementById('eu-id-original');

    function abrirEditarUsuario(usuario) {
        euIdOriginal.value = usuario.id;
        document.getElementById('eu-nombre').value = usuario.nombre;
        document.getElementById('eu-usuario').value = usuario.usuario;
        document.getElementById('eu-rol').value = usuario.rol;
        openModal(editarUsuarioModal);
    }

    editarUsuarioForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = editarUsuarioForm.querySelector('.btn-primary');
        submitButton.disabled = true;
        const loadingToast = showToast('Actualizando usuario...', 'info', 0);

        const formData = new FormData(editarUsuarioForm);
        const payload = Object.fromEntries(formData.entries());
        const id = Number(payload.idOriginal);

        const usuarioDuplicado = usuarios.some((u) => u.usuario === payload.usuario && u.id !== id);
        if (usuarioDuplicado) {
            hideToast(loadingToast);
            showToast('Ocurrió un error al actualizar: el usuario ya existe', 'error');
            submitButton.disabled = false;
            return;
        }

        try {
            // TODO backend: reemplazar por tu endpoint real de Express, ej:
            // const response = await fetch(`/api/usuarios/${id}`, {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(payload)
            // });
            // if (!response.ok) throw new Error('No se pudo actualizar el usuario');

            await mockRequest();

            const index = usuarios.findIndex((u) => u.id === id);
            if (index !== -1) {
                usuarios[index] = { ...usuarios[index], nombre: payload.nombre, usuario: payload.usuario, rol: payload.rol };
            }

            renderTablaUsuarios();
            renderKpis();

            hideToast(loadingToast);
            showToast('Usuario actualizado', 'success');
            closeModal(editarUsuarioModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast('Ocurrió un error al actualizar', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    /* ---------- Eliminar usuario ---------- */

    const eliminarUsuarioModal = document.getElementById('eliminar-usuario-modal');
    const eliminarUsuarioNombre = document.getElementById('eliminar-usuario-nombre');
    const confirmarEliminarUsuarioBtn = document.getElementById('confirmar-eliminar-usuario-btn');
    let idUsuarioAEliminar = null;

    function abrirEliminarUsuario(usuario) {
        idUsuarioAEliminar = usuario.id;
        eliminarUsuarioNombre.textContent = `${usuario.nombre} (${usuario.usuario})`;
        openModal(eliminarUsuarioModal);
    }

    confirmarEliminarUsuarioBtn.addEventListener('click', async () => {
        if (idUsuarioAEliminar === null) return;

        confirmarEliminarUsuarioBtn.disabled = true;
        const loadingToast = showToast('Eliminando usuario...', 'info', 0);

        try {
            // TODO backend: reemplazar por tu endpoint real de Express, ej:
            // const response = await fetch(`/api/usuarios/${idUsuarioAEliminar}`, { method: 'DELETE' });
            // if (!response.ok) throw new Error('No se pudo eliminar el usuario');

            await mockRequest();

            usuarios = usuarios.filter((u) => u.id !== idUsuarioAEliminar);
            renderTablaUsuarios();
            renderKpis();

            hideToast(loadingToast);
            showToast('Usuario eliminado', 'success');
            closeModal(eliminarUsuarioModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast('Ocurrió un error al eliminar', 'error');
        } finally {
            confirmarEliminarUsuarioBtn.disabled = false;
            idUsuarioAEliminar = null;
        }
    });

    /* ---------- Activar / desactivar usuario ---------- */

    async function cambiarEstadoUsuario(usuario) {
        const loadingToast = showToast('Actualizando estado...', 'info', 0);

        try {
            // TODO backend: reemplazar por tu endpoint real de Express, ej:
            // const response = await fetch(`/api/usuarios/${usuario.id}/estado`, {
            //     method: 'PATCH',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ activo: !usuario.activo })
            // });
            // if (!response.ok) throw new Error('No se pudo actualizar el estado');

            await mockRequest(600);

            usuario.activo = !usuario.activo;
            renderTablaUsuarios();
            renderKpis();

            hideToast(loadingToast);
            showToast('Estado actualizado', 'success');

        } catch (error) {
            hideToast(loadingToast);
            showToast('Ocurrió un error al actualizar el estado', 'error');
        }
    }

    /* ---------- Actualizar lista de usuarios ---------- */

    const actualizarUsuariosBtn = document.getElementById('actualizar-usuarios-btn');
    actualizarUsuariosBtn.addEventListener('click', async () => {
        actualizarUsuariosBtn.disabled = true;
        const loadingToast = showToast('Actualizando lista...', 'info', 0);

        try {
            // TODO backend: reemplazar por GET /api/usuarios

            await mockRequest();

            renderTablaUsuarios();
            hideToast(loadingToast);
            showToast('Lista actualizada', 'success');
        } catch (error) {
            hideToast(loadingToast);
            showToast('Ocurrió un error al actualizar la lista', 'error');
        } finally {
            actualizarUsuariosBtn.disabled = false;
        }
    });

    /* ============================================================
       Inventario (solo lectura) — filtro y exportación
       ============================================================ */

    const cuerpoTablaInventario = document.getElementById('cuerpo-tabla-inventario');
    const inventarioVacioRow = document.getElementById('inventario-vacio-row');
    const filtroInventario = document.getElementById('filtro-inventario');
    const filtroInventarioNivel = document.getElementById('filtro-inventario-nivel');

    function obtenerInventarioFiltrado() {
        const busqueda = filtroInventario.value.trim().toLowerCase();
        const nivel = filtroInventarioNivel.value;

        return productos.filter((p) => {
            const coincideBusqueda = !busqueda ||
                p.codigo.toLowerCase().includes(busqueda) ||
                p.nombre.toLowerCase().includes(busqueda);
            const coincideNivel = !nivel || obtenerNivelStock(p.stock) === nivel;
            return coincideBusqueda && coincideNivel;
        });
    }

    function renderTablaInventario() {
        cuerpoTablaInventario.querySelectorAll('tr:not(#inventario-vacio-row)').forEach((row) => row.remove());

        const lista = obtenerInventarioFiltrado();

        if (lista.length === 0) {
            inventarioVacioRow.style.display = '';
            inventarioVacioRow.querySelector('td').textContent = productos.length === 0
                ? 'Aún no hay productos registrados.'
                : 'Ningún producto coincide con los filtros aplicados.';
            return;
        }

        inventarioVacioRow.style.display = 'none';

        lista.forEach((producto) => {
            const nivel = obtenerNivelStock(producto.stock);
            const etiquetaNivel = { alto: 'stock alto', medio: 'stock medio', bajo: 'stock bajo' }[nivel];

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${producto.codigo}</td>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td><span class="badge stock-${nivel}">${producto.stock} · ${etiquetaNivel}</span></td>
            `;
            cuerpoTablaInventario.appendChild(row);
        });
    }

    [filtroInventario, filtroInventarioNivel].forEach((el) => el.addEventListener('input', renderTablaInventario));
    renderTablaInventario();

    const exportarInventarioBtn = document.getElementById('exportar-inventario-btn');

    function generarCSV(lista) {
        const encabezados = ['Código', 'Producto', 'Categoría', 'Stock'];
        const filas = lista.map((p) => [p.codigo, p.nombre, p.categoria, p.stock]);
        return [encabezados, ...filas]
            .map((fila) => fila.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }

    exportarInventarioBtn.addEventListener('click', async () => {
        exportarInventarioBtn.disabled = true;
        const loadingToast = showToast('Generando reporte...', 'info', 0);

        try {
            // TODO backend: si el reporte se genera en el servidor, reemplaza por:
            // const response = await fetch('/api/productos/reporte');
            // const blob = await response.blob();

            await mockRequest(700);

            const csv = generarCSV(obtenerInventarioFiltrado());
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = `reporte-inventario-atlas-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            URL.revokeObjectURL(url);

            hideToast(loadingToast);
            showToast('Reporte exportado', 'success');

        } catch (error) {
            hideToast(loadingToast);
            showToast('Ocurrió un error al exportar', 'error');
        } finally {
            exportarInventarioBtn.disabled = false;
        }
    });

    /* ============================================================
       Cerrar sesión
       ============================================================ */

    const logoutBtn = document.getElementById('logout-btn');

    logoutBtn.addEventListener('click', async () => {
        logoutBtn.disabled = true;
        const loadingToast = showToast('Cerrando sesión...', 'info', 0);

        try {
            // TODO backend: reemplazar por tu endpoint real de Express, ej:
            // const response = await fetch('/api/logout', { method: 'POST' });
            // if (!response.ok) throw new Error('No se pudo cerrar la sesión');

            await mockRequest(700);

            localStorage.removeItem('atlas_usuario');

            hideToast(loadingToast);
            window.location.href = '../index.html';

        } catch (error) {
            hideToast(loadingToast);
            showToast('Ocurrió un error al cerrar la sesión', 'error');
            logoutBtn.disabled = false;
        }
    });

});