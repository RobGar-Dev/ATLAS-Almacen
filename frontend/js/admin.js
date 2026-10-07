//admin.js
/* ============================================================
   Almacén ATLAS — panel de administrador
   Conectado al backend real (ver API_BASE_URL en config.js,
   que debe cargarse antes que este archivo).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Guarda de sesión ----------
       Si no hay token o el rol guardado no es "administrador",
       ni siquiera se intenta cargar el panel. */
    const token = localStorage.getItem(ATLAS_STORAGE_KEYS.token);
    const rolSesion = localStorage.getItem(ATLAS_STORAGE_KEYS.rol);

    if (!token || rolSesion !== 'administrador') {
        window.location.href = '../index.html';
        return;
    }

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

    /* ---------- Fetch autenticado ----------
       Agrega el header Authorization en cada llamada y centraliza
       el manejo de errores. Si el token ya expiró (401), cierra la
       sesión local y regresa al login. */
    async function apiFetch(path, options = {}) {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem(ATLAS_STORAGE_KEYS.token)}`,
                ...(options.headers || {}),
            },
        });

        if (response.status === 401) {
            localStorage.removeItem(ATLAS_STORAGE_KEYS.token);
            localStorage.removeItem(ATLAS_STORAGE_KEYS.nombre);
            localStorage.removeItem(ATLAS_STORAGE_KEYS.rol);
            window.location.href = '../index.html';
            throw new Error('Sesión expirada');
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
            throw new Error(data.message || 'Ocurrió un error con el servidor');
        }

        return data;
    }

    /* ---------- Sesión ---------- */
    document.getElementById('nombre-admin').textContent =
        localStorage.getItem(ATLAS_STORAGE_KEYS.nombre) || 'Administrador';

    /* ============================================================
       Navegación entre secciones
       ============================================================ */

    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');

    navItems.forEach((btn) => {
        btn.addEventListener('click', async () => {
            navItems.forEach((b) => b.classList.remove('is-active'));
            sections.forEach((s) => s.classList.remove('is-active'));

            btn.classList.add('is-active');
            document.getElementById(`section-${btn.dataset.section}`).classList.add('is-active');

            // El inventario no tiene botón "Actualizar" propio, así que
            // se refresca solo al entrar a la pestaña.
            if (btn.dataset.section === 'inventario') {
                try {
                    await cargarProductos();
                    renderTablaInventario();
                } catch (error) {
                    showToast(error.message || 'No se pudo actualizar el inventario', 'error');
                }
            }

            if (btn.dataset.section === 'movimientos') {
                try {
                    await cargarHistorialMovimientos();
                    renderTablaMovimientos();
                } catch (error) {
                    showToast(error.message || 'No se pudo cargar el historial de movimientos', 'error');
                }
            }
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
       Estado en memoria (se llena desde el backend)
       ============================================================ */

    let productos = [];
    let usuarios = [];
    let movimientosSemana = [];

    async function cargarProductos() {
        const data = await apiFetch('/productos');
        productos = data.productos;
    }

    async function cargarUsuarios() {
        const data = await apiFetch('/usuarios');
        usuarios = data.usuarios;
    }

    /* El backend regresa filas agrupadas por día + tipo (solo los días
       que tuvieron movimientos). Se rellenan los días faltantes con 0
       para que la gráfica siempre muestre los últimos N días completos. */
    function construirRangoDias(dias) {
        const rango = [];
        for (let i = dias - 1; i >= 0; i--) {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - i);
            rango.push(fecha.toISOString().slice(0, 10)); // YYYY-MM-DD
        }
        return rango;
    }

    function formatearDiaCorto(fechaISO) {
        const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const fecha = new Date(`${fechaISO}T00:00:00`);
        return nombresDias[fecha.getDay()];
    }

    function transformarMovimientos(filas, dias) {
        const rango = construirRangoDias(dias);
        return rango.map((fechaISO) => ({
            dia: formatearDiaCorto(fechaISO),
            entradas: filas
                .filter((f) => f.dia === fechaISO && f.tipo === 'entrada')
                .reduce((acc, f) => acc + Number(f.total), 0),
            salidas: filas
                .filter((f) => f.dia === fechaISO && f.tipo === 'salida')
                .reduce((acc, f) => acc + Number(f.total), 0),
        }));
    }

    async function cargarMovimientos(dias = 7) {
        const data = await apiFetch(`/movimientos?dias=${dias}`);
        movimientosSemana = transformarMovimientos(data.movimientos, dias);
    }

    async function cargarTodo() {
        await Promise.all([cargarProductos(), cargarUsuarios(), cargarMovimientos(7), cargarSolpeds()]);
    }

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
        coral: '#ff5470',
        mint: '#17b890',
        amber: '#f5a524',
        rose: '#e0264f',
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
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16 } } },
            },
        });

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

    const actualizarDashboardBtn = document.getElementById('actualizar-dashboard-btn');
    actualizarDashboardBtn.addEventListener('click', async () => {
        actualizarDashboardBtn.disabled = true;
        const loadingToast = showToast('Actualizando dashboard...', 'info', 0);

        try {
            await cargarTodo();
            renderDashboard();
            hideToast(loadingToast);
            showToast('Dashboard actualizado', 'success');
        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error al actualizar el dashboard', 'error');
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

        try {
            const data = await apiFetch('/usuarios', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            usuarios.push(data.usuario);
            renderTablaUsuarios();
            renderKpis();

            hideToast(loadingToast);
            showToast('Registro exitoso', 'success');
            nuevoUsuarioForm.reset();
            closeModal(nuevoUsuarioModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error con el registro', 'error');
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
        document.getElementById('eu-password').value = ''; // nunca se precarga una contraseña
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

        const cuerpo = { nombre: payload.nombre, usuario: payload.usuario, rol: payload.rol };
        if (payload.password) cuerpo.password = payload.password; // solo si el admin escribió una nueva

        try {
            const data = await apiFetch(`/usuarios/${id}`, {
                method: 'PUT',
                body: JSON.stringify(cuerpo),
            });

            const index = usuarios.findIndex((u) => u.id === id);
            if (index !== -1) {
                usuarios[index] = { ...usuarios[index], ...data.usuario };
            }

            renderTablaUsuarios();
            renderKpis();

            hideToast(loadingToast);
            showToast('Usuario actualizado', 'success');
            closeModal(editarUsuarioModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error al actualizar', 'error');
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
            await apiFetch(`/usuarios/${idUsuarioAEliminar}`, { method: 'DELETE' });

            usuarios = usuarios.filter((u) => u.id !== idUsuarioAEliminar);
            renderTablaUsuarios();
            renderKpis();

            hideToast(loadingToast);
            showToast('Usuario eliminado', 'success');
            closeModal(eliminarUsuarioModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error al eliminar', 'error');
        } finally {
            confirmarEliminarUsuarioBtn.disabled = false;
            idUsuarioAEliminar = null;
        }
    });

    /* ---------- Activar / desactivar usuario ---------- */

    async function cambiarEstadoUsuario(usuario) {
        const loadingToast = showToast('Actualizando estado...', 'info', 0);

        try {
            await apiFetch(`/usuarios/${usuario.id}/estado`, {
                method: 'PATCH',
                body: JSON.stringify({ activo: !usuario.activo }),
            });

            usuario.activo = !usuario.activo;
            renderTablaUsuarios();
            renderKpis();

            hideToast(loadingToast);
            showToast('Estado actualizado', 'success');

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error al actualizar el estado', 'error');
        }
    }

    /* ---------- Actualizar lista de usuarios ---------- */

    const actualizarUsuariosBtn = document.getElementById('actualizar-usuarios-btn');
    actualizarUsuariosBtn.addEventListener('click', async () => {
        actualizarUsuariosBtn.disabled = true;
        const loadingToast = showToast('Actualizando lista...', 'info', 0);

        try {
            await cargarUsuarios();
            renderTablaUsuarios();
            renderKpis();
            hideToast(loadingToast);
            showToast('Lista actualizada', 'success');
        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error al actualizar la lista', 'error');
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

    const exportarInventarioBtn = document.getElementById('exportar-inventario-btn');

    function generarCSV(lista) {
        const encabezados = ['Código', 'Producto', 'Categoría', 'Stock'];
        const filas = lista.map((p) => [p.codigo, p.nombre, p.categoria, p.stock]);
        return [encabezados, ...filas]
            .map((fila) => fila.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }

    exportarInventarioBtn.addEventListener('click', () => {
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

        showToast('Reporte exportado', 'success');
    });

    /* ============================================================
       Movimientos (historial detallado — no confundir con
       movimientosSemana, que solo alimenta la gráfica del dashboard)
       ============================================================ */

    let historialMovimientos = [];

    const cuerpoTablaMovimientos = document.getElementById('cuerpo-tabla-movimientos');
    const movimientosVacioRow = document.getElementById('movimientos-vacio-row');
    const filtroMovimientos = document.getElementById('filtro-movimientos');
    const filtroMovimientosTipo = document.getElementById('filtro-movimientos-tipo');

    async function cargarHistorialMovimientos() {
        const data = await apiFetch('/movimientos/historial');
        historialMovimientos = data.movimientos;
    }

    // El backend regresa la fecha como texto plano 'YYYY-MM-DD HH:MM:SS'
    // (gracias a dateStrings:true), así que se formatea sin pasar por Date.
    function formatearFechaHora(fechaTexto) {
        const [fecha, hora] = fechaTexto.split(' ');
        const [anio, mes, dia] = fecha.split('-');
        return `${dia}/${mes}/${anio} ${hora ? hora.slice(0, 5) : ''}`;
    }

    function obtenerMovimientosFiltrados() {
        const busqueda = filtroMovimientos.value.trim().toLowerCase();
        const tipo = filtroMovimientosTipo.value;

        return historialMovimientos.filter((m) => {
            const coincideBusqueda = !busqueda ||
                m.producto_nombre.toLowerCase().includes(busqueda) ||
                m.producto_codigo.toLowerCase().includes(busqueda) ||
                m.usuario_nombre.toLowerCase().includes(busqueda);
            const coincideTipo = !tipo || m.tipo === tipo;
            return coincideBusqueda && coincideTipo;
        });
    }

    function renderTablaMovimientos() {
        cuerpoTablaMovimientos.querySelectorAll('tr:not(#movimientos-vacio-row)').forEach((row) => row.remove());

        const lista = obtenerMovimientosFiltrados();

        if (lista.length === 0) {
            movimientosVacioRow.style.display = '';
            movimientosVacioRow.querySelector('td').textContent = historialMovimientos.length === 0
                ? 'Aún no hay movimientos registrados.'
                : 'Ningún movimiento coincide con los filtros aplicados.';
            return;
        }

        movimientosVacioRow.style.display = 'none';

        lista.forEach((mov) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatearFechaHora(mov.fecha)}</td>
                <td>${mov.producto_codigo} · ${mov.producto_nombre}</td>
                <td><span class="badge badge-tipo-${mov.tipo}">${mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}</span></td>
                <td>${mov.cantidad}</td>
                <td>${mov.motivo || '—'}</td>
                <td>${mov.usuario_nombre}</td>
            `;
            cuerpoTablaMovimientos.appendChild(row);
        });
    }

    [filtroMovimientos, filtroMovimientosTipo].forEach((el) => el.addEventListener('input', renderTablaMovimientos));

    const actualizarMovimientosBtn = document.getElementById('actualizar-movimientos-btn');
    actualizarMovimientosBtn.addEventListener('click', async () => {
        actualizarMovimientosBtn.disabled = true;
        const loadingToast = showToast('Actualizando movimientos...', 'info', 0);

        try {
            await cargarHistorialMovimientos();
            renderTablaMovimientos();
            hideToast(loadingToast);
            showToast('Movimientos actualizados', 'success');
        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error al actualizar los movimientos', 'error');
        } finally {
            actualizarMovimientosBtn.disabled = false;
        }
    });

    const exportarMovimientosBtn = document.getElementById('exportar-movimientos-btn');

    function generarCSVMovimientos(lista) {
        const encabezados = ['Fecha y hora', 'Código', 'Producto', 'Tipo', 'Cantidad', 'Motivo', 'Usuario'];
        const filas = lista.map((m) => [
            m.fecha,
            m.producto_codigo,
            m.producto_nombre,
            m.tipo === 'entrada' ? 'Entrada' : 'Salida',
            m.cantidad,
            m.motivo || '',
            m.usuario_nombre,
        ]);

        return [encabezados, ...filas]
            .map((fila) => fila.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }

    exportarMovimientosBtn.addEventListener('click', () => {
        if (historialMovimientos.length === 0) {
            showToast('No hay movimientos para exportar', 'error');
            return;
        }

        const csv = generarCSVMovimientos(obtenerMovimientosFiltrados());
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `historial-movimientos-atlas-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        URL.revokeObjectURL(url);

        showToast('Historial exportado', 'success');
    });

    /* ============================================================
   Solicitudes de pedido (solped)
   ============================================================ */

    let solpeds = [];

    const cuerpoTablaSolped = document.getElementById('cuerpo-tabla-solped');
    const solpedVacioRow = document.getElementById('solped-vacio-row');
    const filtroSolped = document.getElementById('filtro-solped');
    const filtroSolpedEstatus = document.getElementById('filtro-solped-estatus');
    const verSolpedModal = document.getElementById('ver-solped-modal');

    async function cargarSolpeds() {
        const data = await apiFetch('/solpeds');
        solpeds = data.solpeds;
    }

    function obtenerSolpedsFiltradas() {
        const busqueda = filtroSolped.value.trim().toLowerCase();
        const estatus = filtroSolpedEstatus.value;

        return solpeds.filter((s) => {
            const coincideBusqueda = !busqueda || String(s.numero).toLowerCase().includes(busqueda);
            const coincideEstatus = !estatus || s.estatus === estatus;
            return coincideBusqueda && coincideEstatus;
        });
    }

    const etiquetaEstatus = {
        activa: 'Activa',
        cerrada: 'Cerrada',
        pendiente: 'Pendiente',
        cancelada: 'Cancelada',
    };

    function renderTablaSolped() {
        cuerpoTablaSolped.querySelectorAll('tr:not(#solped-vacio-row)').forEach((row) => row.remove());

        const lista = obtenerSolpedsFiltradas();

        if (lista.length === 0) {
            solpedVacioRow.style.display = '';
            solpedVacioRow.querySelector('td').textContent = solpeds.length === 0
                ? 'Aún no hay solicitudes registradas.'
                : 'Ninguna solicitud coincide con los filtros aplicados.';
            return;
        }

        solpedVacioRow.style.display = 'none';

        lista.forEach((solped) => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${solped.numero}</td>
            <td>${formatearFechaHora(solped.fecha_creacion)}</td>
            <td>${solped.total_productos ?? '—'}</td>
            <td>${solped.solicitante_nombre ?? '—'}</td>
            <td><span class="badge badge-solped-${solped.estatus}">${etiquetaEstatus[solped.estatus] ?? solped.estatus}</span></td>
            <td>
                <div class="fila-acciones">
                    <button type="button" class="btn-icono" data-accion="ver" data-id="${solped.id}">Ver</button>
                    <button type="button" class="btn-icono btn-icono-danger" data-accion="cancelar" data-id="${solped.id}">Cancelar</button>
                </div>
            </td>
        `;
            cuerpoTablaSolped.appendChild(row);
        });
    }

    [filtroSolped, filtroSolpedEstatus].forEach((el) => el.addEventListener('input', renderTablaSolped));

    /* ---------- Abrir modal "Ver solped" ---------- */

    function abrirVerSolped(solped) {
        document.getElementById('ver-solped-numero').textContent = solped.numero;
        document.getElementById('ver-solped-fecha').textContent = formatearFechaHora(solped.fecha_creacion);
        document.getElementById('ver-solped-solicitante').textContent = solped.solicitante_nombre ?? '—';
        document.getElementById('ver-solped-notas').textContent = solped.notas || '—';

        // Badge de estatus
        const estatusEl = document.getElementById('ver-solped-estatus');
        estatusEl.innerHTML = `<span class="badge badge-solped-${solped.estatus}">${etiquetaEstatus[solped.estatus] ?? solped.estatus}</span>`;

        // Tabla de productos
        const tbody = document.getElementById('ver-solped-productos');
        tbody.innerHTML = '';

        if (solped.productos && solped.productos.length > 0) {
            solped.productos.forEach((p) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${p.codigo}</td>
                <td>${p.nombre}</td>
                <td>${p.cantidad}</td>
            `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr class="tabla-vacio"><td colspan="3">Sin productos registrados</td></tr>';
        }

        openModal(verSolpedModal);
    }

    /* ---------- Delegación de eventos en la tabla ---------- */

    cuerpoTablaSolped.addEventListener('click', async (event) => {
        const btn = event.target.closest('[data-accion]');
        if (!btn) return;

        const id = Number(btn.dataset.id);
        const solped = solpeds.find((s) => s.id === id);
        if (!solped) return;

        if (btn.dataset.accion === 'ver') {
            // Si los productos vienen en la lista, se muestran directo;
            // si el backend los omite por peso, se hace una segunda llamada.
            if (solped.productos) {
                abrirVerSolped(solped);
            } else {
                const loadingToast = showToast('Cargando solicitud...', 'info', 0);
                try {
                    const data = await apiFetch(`/solpeds/${id}`);
                    Object.assign(solped, data.solped); // cachea para la próxima vez
                    hideToast(loadingToast);
                    abrirVerSolped(solped);
                } catch (error) {
                    hideToast(loadingToast);
                    showToast(error.message || 'No se pudo cargar la solicitud', 'error');
                }
            }
        }

        if (btn.dataset.accion === 'cancelar') {
            if (!confirm(`¿Cancelar la solicitud #${solped.numero}? Esta acción no se puede deshacer.`)) return;

            const loadingToast = showToast('Cancelando solicitud...', 'info', 0);
            try {
                await apiFetch(`/solpeds/${id}/estatus`, {
                    method: 'PATCH',
                    body: JSON.stringify({ estatus: 'cancelada' }),
                });
                solped.estatus = 'cancelada';
                renderTablaSolped();
                hideToast(loadingToast);
                showToast('Solicitud cancelada', 'success');
            } catch (error) {
                hideToast(loadingToast);
                showToast(error.message || 'No se pudo cancelar la solicitud', 'error');
            }
        }
    });

    /* ---------- Actualizar ---------- */

    document.getElementById('actualizar-solped-btn').addEventListener('click', async () => {
        const btn = document.getElementById('actualizar-solped-btn');
        btn.disabled = true;
        const loadingToast = showToast('Actualizando solicitudes...', 'info', 0);
        try {
            await cargarSolpeds();
            renderTablaSolped();
            hideToast(loadingToast);
            showToast('Solicitudes actualizadas', 'success');
        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'No se pudo actualizar las solicitudes', 'error');
        } finally {
            btn.disabled = false;
        }
    });

    /* ---------- Exportar ---------- */

    function generarCSVSolped(lista) {
        const encabezados = ['# Solicitud', 'Fecha', 'Solicitante', 'Productos', 'Estatus'];
        const filas = lista.map((s) => [
            s.numero,
            s.fecha_creacion,
            s.solicitante_nombre ?? '',
            s.total_productos ?? '',
            etiquetaEstatus[s.estatus] ?? s.estatus,
        ]);
        return [encabezados, ...filas]
            .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }

    document.getElementById('exportar-solped-btn').addEventListener('click', () => {
        if (solpeds.length === 0) {
            showToast('No hay solicitudes para exportar', 'error');
            return;
        }
        const csv = generarCSVSolped(obtenerSolpedsFiltradas());
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `solpeds-atlas-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Historial exportado', 'success');
    });

    /* ============================================================
       Cerrar sesión
       ============================================================ */

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem(ATLAS_STORAGE_KEYS.token);
        localStorage.removeItem(ATLAS_STORAGE_KEYS.nombre);
        localStorage.removeItem(ATLAS_STORAGE_KEYS.rol);
        window.location.href = '../index.html';
    });

    /* ============================================================
       Carga inicial
       ============================================================ */

    (async () => {
        try {
            await cargarTodo();
            renderDashboard();
            renderTablaUsuarios();
            renderTablaInventario();
            renderTablaSolped();
        } catch (error) {
            showToast(error.message || 'No se pudo cargar la información inicial', 'error');
        }
    })();

});