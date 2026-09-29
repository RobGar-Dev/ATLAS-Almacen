//usuario.js
/* ============================================================
   Almacén ATLAS — lógica de la vista de usuario (CRUD)
   Conectado al backend real (ver API_BASE_URL en config.js,
   que debe cargarse antes que este archivo).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Guarda de sesión ----------
       Esta vista es para el rol "vendedor". Si no hay token o el
       rol guardado no coincide, ni siquiera se intenta cargar. */
    const token = localStorage.getItem(ATLAS_STORAGE_KEYS.token);
    const rolSesion = localStorage.getItem(ATLAS_STORAGE_KEYS.rol);

    if (!token || rolSesion !== 'vendedor') {
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

    /* ============================================================
       Datos de usuario en sesión
       ============================================================ */

    document.getElementById('nombre-usuario').textContent =
        localStorage.getItem(ATLAS_STORAGE_KEYS.nombre) || 'Usuario';

    /* ============================================================
       Niveles de stock
       ============================================================ */

    // Umbrales de nivel de stock (inclusive: el nivel aplica desde esa cantidad hacia arriba)
    const STOCK_ALTO_LIMITE = 30;  // >= 30 piezas → alto (verde)
    const STOCK_MEDIO_LIMITE = 15; // >= 15 piezas → medio (amarillo)

    /**
     * Determina el nivel de stock de un producto.
     * @param {number} stock
     * @returns {'alto'|'medio'|'bajo'}
     */
    function obtenerNivelStock(stock) {
        if (stock >= STOCK_ALTO_LIMITE) return 'alto';
        if (stock >= STOCK_MEDIO_LIMITE) return 'medio';
        return 'bajo';
    }

    /* ============================================================
       Estado en memoria (se llena desde el backend)
       ============================================================ */

    let productos = [];

    async function cargarProductos() {
        const data = await apiFetch('/productos');
        productos = data.productos;
    }

    const cuerpoTabla = document.getElementById('cuerpo-tabla');
    const tablaVaciaRow = document.getElementById('tabla-vacio-row');
    const filtroBusqueda = document.getElementById('filtro-busqueda');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroStock = document.getElementById('filtro-stock');
    const limpiarFiltrosBtn = document.getElementById('limpiar-filtros-btn');

    /* ---------- Filtros ---------- */

    function actualizarOpcionesCategoria() {
        const seleccionActual = filtroCategoria.value;
        const categorias = [...new Set(productos.map((p) => p.categoria))].sort();

        filtroCategoria.innerHTML = '<option value="">Todas</option>' +
            categorias.map((c) => `<option value="${c}">${c}</option>`).join('');

        if (categorias.includes(seleccionActual)) {
            filtroCategoria.value = seleccionActual;
        }
    }

    function obtenerProductosFiltrados() {
        const busqueda = filtroBusqueda.value.trim().toLowerCase();
        const categoria = filtroCategoria.value;
        const stockFiltro = filtroStock.value;

        return productos.filter((p) => {
            const coincideBusqueda = !busqueda ||
                p.codigo.toLowerCase().includes(busqueda) ||
                p.nombre.toLowerCase().includes(busqueda);

            const coincideCategoria = !categoria || p.categoria === categoria;

            const coincideStock = !stockFiltro || obtenerNivelStock(p.stock) === stockFiltro;

            return coincideBusqueda && coincideCategoria && coincideStock;
        });
    }

    [filtroBusqueda, filtroCategoria, filtroStock].forEach((el) => {
        el.addEventListener('input', renderTabla);
    });

    limpiarFiltrosBtn.addEventListener('click', () => {
        filtroBusqueda.value = '';
        filtroCategoria.value = '';
        filtroStock.value = '';
        renderTabla();
    });

    /* ---------- Render de tabla ---------- */

    function renderTabla() {
        cuerpoTabla.querySelectorAll('tr:not(#tabla-vacio-row)').forEach((row) => row.remove());

        const productosFiltrados = obtenerProductosFiltrados();

        if (productosFiltrados.length === 0) {
            tablaVaciaRow.style.display = '';
            tablaVaciaRow.querySelector('td').textContent = productos.length === 0
                ? 'Aún no hay productos registrados.'
                : 'Ningún producto coincide con los filtros aplicados.';
            return;
        }

        tablaVaciaRow.style.display = 'none';

        productosFiltrados.forEach((producto) => {
            const row = document.createElement('tr');
            const nivel = obtenerNivelStock(producto.stock);
            const etiquetaNivel = { alto: 'stock alto', medio: 'stock medio', bajo: 'stock bajo' }[nivel];
            const stockBadge = `<span class="stock-nivel stock-${nivel}">${producto.stock} · ${etiquetaNivel}</span>`;

            row.innerHTML = `
                <td>${producto.codigo}</td>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td>${stockBadge}</td>
                <td>
                    <div class="fila-acciones">
                        <button type="button" class="btn-icono" data-accion="movimiento" data-id="${producto.id}">Entrada/Salida</button>
                        <button type="button" class="btn-icono" data-accion="editar" data-id="${producto.id}">Editar</button>
                        <button type="button" class="btn-icono btn-icono-danger" data-accion="eliminar" data-id="${producto.id}">Eliminar</button>
                    </div>
                </td>
            `;
            cuerpoTabla.appendChild(row);
        });
    }

    cuerpoTabla.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-accion]');
        if (!btn) return;

        const id = Number(btn.dataset.id);
        const producto = productos.find((p) => p.id === id);
        if (!producto) return;

        if (btn.dataset.accion === 'editar') abrirEditarProducto(producto);
        if (btn.dataset.accion === 'eliminar') abrirEliminarProducto(producto);
        if (btn.dataset.accion === 'movimiento') abrirMovimiento(producto);
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
       CRUD — Registrar producto
       ============================================================ */

    const nuevoProductoModal = document.getElementById('nuevo-producto-modal');
    const openNuevoProductoBtn = document.getElementById('open-nuevo-producto');
    const nuevoProductoForm = document.getElementById('nuevo-producto-form');

    openNuevoProductoBtn.addEventListener('click', () => openModal(nuevoProductoModal));

    nuevoProductoForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = nuevoProductoForm.querySelector('.btn-primary');
        submitButton.disabled = true;

        const loadingToast = showToast('Registrando producto...', 'info', 0);

        const formData = new FormData(nuevoProductoForm);
        const payload = Object.fromEntries(formData.entries());
        payload.stock = Number(payload.stock);

        try {
            const data = await apiFetch('/productos', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            productos.push(data.producto);
            actualizarOpcionesCategoria();
            renderTabla();

            hideToast(loadingToast);
            showToast('Registro exitoso', 'success');
            nuevoProductoForm.reset();
            closeModal(nuevoProductoModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error con el registro', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    /* ============================================================
       CRUD — Editar producto
       ============================================================ */

    const editarProductoModal = document.getElementById('editar-producto-modal');
    const editarProductoForm = document.getElementById('editar-producto-form');
    const editarIdOriginal = document.getElementById('editar-id-original');

    function abrirEditarProducto(producto) {
        editarIdOriginal.value = producto.id;
        document.getElementById('editar-codigo').value = producto.codigo;
        document.getElementById('editar-nombre').value = producto.nombre;
        document.getElementById('editar-categoria').value = producto.categoria;
        document.getElementById('editar-stock').value = producto.stock;
        openModal(editarProductoModal);
    }

    editarProductoForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = editarProductoForm.querySelector('.btn-primary');
        submitButton.disabled = true;

        const loadingToast = showToast('Actualizando producto...', 'info', 0);

        const formData = new FormData(editarProductoForm);
        const payload = Object.fromEntries(formData.entries());
        payload.stock = Number(payload.stock);
        const id = Number(payload.idOriginal);
        delete payload.idOriginal;

        try {
            const data = await apiFetch(`/productos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            const index = productos.findIndex((p) => p.id === id);
            if (index !== -1) productos[index] = data.producto;

            actualizarOpcionesCategoria();
            renderTabla();

            hideToast(loadingToast);
            showToast('Producto actualizado', 'success');
            closeModal(editarProductoModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error al actualizar', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    /* ============================================================
       CRUD — Eliminar producto
       ============================================================ */

    const eliminarProductoModal = document.getElementById('eliminar-producto-modal');
    const eliminarProductoNombre = document.getElementById('eliminar-producto-nombre');
    const confirmarEliminarBtn = document.getElementById('confirmar-eliminar-btn');
    let idAEliminar = null;

    function abrirEliminarProducto(producto) {
        idAEliminar = producto.id;
        eliminarProductoNombre.textContent = `${producto.codigo} · ${producto.nombre}`;
        openModal(eliminarProductoModal);
    }

    confirmarEliminarBtn.addEventListener('click', async () => {
        if (idAEliminar === null) return;

        confirmarEliminarBtn.disabled = true;
        const loadingToast = showToast('Eliminando producto...', 'info', 0);

        try {
            await apiFetch(`/productos/${idAEliminar}`, { method: 'DELETE' });

            productos = productos.filter((p) => p.id !== idAEliminar);
            actualizarOpcionesCategoria();
            renderTabla();

            hideToast(loadingToast);
            showToast('Producto eliminado', 'success');
            closeModal(eliminarProductoModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error al eliminar', 'error');
        } finally {
            confirmarEliminarBtn.disabled = false;
            idAEliminar = null;
        }
    });

    /* ============================================================
       Registrar entradas y salidas de inventario
       ============================================================ */

    const movimientoModal = document.getElementById('movimiento-modal');
    const movimientoForm = document.getElementById('movimiento-form');
    const movimientoProductoIdInput = document.getElementById('movimiento-producto-id');
    const movimientoProductoNombre = document.getElementById('movimiento-producto-nombre');

    function abrirMovimiento(producto) {
        movimientoForm.reset();
        movimientoProductoIdInput.value = producto.id;
        movimientoProductoNombre.textContent = `${producto.codigo} · ${producto.nombre} (stock actual: ${producto.stock})`;
        openModal(movimientoModal);
    }

    movimientoForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = movimientoForm.querySelector('.btn-primary');
        submitButton.disabled = true;

        const loadingToast = showToast('Registrando movimiento...', 'info', 0);

        const formData = new FormData(movimientoForm);
        const payload = Object.fromEntries(formData.entries());
        payload.productoId = Number(payload.productoId);
        payload.cantidad = Number(payload.cantidad);

        try {
            // El backend calcula el nuevo stock de forma atómica (con
            // transacción) y valida que no quede negativo — no se
            // duplica esa lógica aquí, solo se usa lo que regresa.
            const data = await apiFetch('/movimientos', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            const producto = productos.find((p) => p.id === payload.productoId);
            if (producto) producto.stock = data.movimiento.nuevoStock;

            renderTabla();

            hideToast(loadingToast);
            showToast('Movimiento registrado', 'success');
            closeModal(movimientoModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error con el movimiento', 'error');
        } finally {
            submitButton.disabled = false;
        }
    });

    /* ============================================================
       Actualizar (refrescar) lista de productos
       ============================================================ */

    const actualizarBtn = document.getElementById('actualizar-btn');

    actualizarBtn.addEventListener('click', async () => {
        actualizarBtn.disabled = true;
        const loadingToast = showToast('Actualizando lista...', 'info', 0);

        try {
            await cargarProductos();
            actualizarOpcionesCategoria();
            renderTabla();

            hideToast(loadingToast);
            showToast('Lista actualizada', 'success');

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error al actualizar la lista', 'error');
        } finally {
            actualizarBtn.disabled = false;
        }
    });

    /* ============================================================
       Exportar reporte (CSV)
       ============================================================ */

    const exportarBtn = document.getElementById('exportar-btn');

    function generarCSV(lista) {
        const encabezados = ['Código', 'Producto', 'Categoría', 'Stock'];
        const filas = lista.map((p) => [p.codigo, p.nombre, p.categoria, p.stock]);

        return [encabezados, ...filas]
            .map((fila) => fila.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }

    exportarBtn.addEventListener('click', () => {
        const csv = generarCSV(obtenerProductosFiltrados());
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
       Solicitud de pedido (SOLPED) — se guarda en el sistema para
       que el administrador la revise (la vista de admin se agrega
       en un paso posterior; por ahora esto ya la deja registrada).
       ============================================================ */

    const solpedModal = document.getElementById('solped-modal');
    const openSolpedBtn = document.getElementById('open-solped');
    const cuerpoSolped = document.getElementById('cuerpo-solped');
    const solpedVacioRow = document.getElementById('solped-vacio-row');
    const seleccionarTodosSolpedBtn = document.getElementById('seleccionar-todos-solped-btn');
    const confirmarSolpedBtn = document.getElementById('confirmar-solped-btn');

    // Misma sugerencia que usábamos antes: lo que falta para llegar a
    // stock medio, con un mínimo de 5 — editable por fila.
    function sugerirCantidadSolped(producto) {
        return Math.max(STOCK_MEDIO_LIMITE - producto.stock, 5);
    }

    function renderSolped() {
        cuerpoSolped.querySelectorAll('tr:not(#solped-vacio-row)').forEach((row) => row.remove());

        if (productos.length === 0) {
            solpedVacioRow.style.display = '';
            solpedVacioRow.querySelector('td').textContent = 'Aún no hay productos registrados.';
            return;
        }

        solpedVacioRow.style.display = 'none';

        productos.forEach((producto) => {
            const nivel = obtenerNivelStock(producto.stock);
            // Los de stock bajo vienen premarcados — es lo más probable
            // que el vendedor quiera pedir — pero cualquiera es elegible.
            const marcadoPorDefecto = nivel === 'bajo';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="solped-check" data-id="${producto.id}" ${marcadoPorDefecto ? 'checked' : ''}></td>
                <td>${producto.codigo} · ${producto.nombre}</td>
                <td>${producto.stock}</td>
                <td>
                    <input type="number" min="1" step="1" class="solped-cantidad" data-id="${producto.id}"
                        value="${sugerirCantidadSolped(producto)}" ${marcadoPorDefecto ? '' : 'disabled'}>
                </td>
                <td>
                    <select class="solped-urgencia" data-id="${producto.id}" ${marcadoPorDefecto ? '' : 'disabled'}>
                        <option value="Programable">Programable</option>
                        <option value="Urgente" ${nivel === 'bajo' ? 'selected' : ''}>Urgente</option>
                        <option value="Muy urgente">Muy urgente</option>
                    </select>
                </td>
            `;
            cuerpoSolped.appendChild(row);
        });
    }

    // Al (des)marcar una fila, se habilita/deshabilita su cantidad y
    // urgencia — así solo se manda lo que de verdad quedó seleccionado.
    cuerpoSolped.addEventListener('change', (event) => {
        if (!event.target.classList.contains('solped-check')) return;

        const fila = event.target.closest('tr');
        fila.querySelector('.solped-cantidad').disabled = !event.target.checked;
        fila.querySelector('.solped-urgencia').disabled = !event.target.checked;
    });

    openSolpedBtn.addEventListener('click', () => {
        renderSolped();
        openModal(solpedModal);
    });

    seleccionarTodosSolpedBtn.addEventListener('click', () => {
        cuerpoSolped.querySelectorAll('.solped-check').forEach((checkbox) => {
            checkbox.checked = true;
            const fila = checkbox.closest('tr');
            fila.querySelector('.solped-cantidad').disabled = false;
            fila.querySelector('.solped-urgencia').disabled = false;
        });
    });

    confirmarSolpedBtn.addEventListener('click', async () => {
        const items = Array.from(cuerpoSolped.querySelectorAll('.solped-check:checked'))
            .map((checkbox) => {
                const fila = checkbox.closest('tr');
                return {
                    productoId: Number(checkbox.dataset.id),
                    cantidad: Number(fila.querySelector('.solped-cantidad').value),
                    urgencia: fila.querySelector('.solped-urgencia').value,
                };
            });

        if (items.length === 0) {
            showToast('Selecciona al menos un producto', 'error');
            return;
        }

        confirmarSolpedBtn.disabled = true;
        const loadingToast = showToast('Enviando solicitud...', 'info', 0);

        try {
            await apiFetch('/solicitudes', {
                method: 'POST',
                body: JSON.stringify({ items }),
            });

            hideToast(loadingToast);
            showToast('Solicitud enviada al administrador', 'success');
            closeModal(solpedModal);

        } catch (error) {
            hideToast(loadingToast);
            showToast(error.message || 'Ocurrió un error al enviar la solicitud', 'error');
        } finally {
            confirmarSolpedBtn.disabled = false;
        }
    });

    /* ============================================================
       Historial de movimientos
       ============================================================ */

    let historial = [];

    const historialModal = document.getElementById('historial-modal');
    const openHistorialBtn = document.getElementById('open-historial');
    const cuerpoHistorial = document.getElementById('cuerpo-historial');
    const historialVacioRow = document.getElementById('historial-vacio-row');
    const exportarHistorialBtn = document.getElementById('exportar-historial-btn');

    async function cargarHistorial() {
        const data = await apiFetch('/movimientos/historial');
        historial = data.movimientos;
    }

    // El backend regresa la fecha como texto plano 'YYYY-MM-DD HH:MM:SS'
    // (gracias a dateStrings:true), así que se formatea sin pasar por Date.
    function formatearFechaHora(fechaTexto) {
        const [fecha, hora] = fechaTexto.split(' ');
        const [anio, mes, dia] = fecha.split('-');
        return `${dia}/${mes}/${anio} ${hora ? hora.slice(0, 5) : ''}`;
    }

    function renderHistorial() {
        cuerpoHistorial.querySelectorAll('tr:not(#historial-vacio-row)').forEach((row) => row.remove());

        if (historial.length === 0) {
            historialVacioRow.style.display = '';
            historialVacioRow.querySelector('td').textContent = 'Aún no hay movimientos registrados.';
            return;
        }

        historialVacioRow.style.display = 'none';

        historial.forEach((mov) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatearFechaHora(mov.fecha)}</td>
                <td>${mov.producto_codigo} · ${mov.producto_nombre}</td>
                <td><span class="badge badge-tipo-${mov.tipo}">${mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}</span></td>
                <td>${mov.cantidad}</td>
                <td>${mov.motivo || '—'}</td>
                <td>${mov.usuario_nombre}</td>
            `;
            cuerpoHistorial.appendChild(row);
        });
    }

    openHistorialBtn.addEventListener('click', async () => {
        openModal(historialModal);
        historialVacioRow.querySelector('td').textContent = 'Cargando historial...';

        try {
            await cargarHistorial();
            renderHistorial();
        } catch (error) {
            showToast(error.message || 'No se pudo cargar el historial', 'error');
        }
    });

    function generarCSVHistorial(lista) {
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

    exportarHistorialBtn.addEventListener('click', () => {
        if (historial.length === 0) {
            showToast('No hay historial para exportar', 'error');
            return;
        }

        const csv = generarCSVHistorial(historial);
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
            await cargarProductos();
            actualizarOpcionesCategoria();
            renderTabla();
        } catch (error) {
            showToast(error.message || 'No se pudo cargar el inventario', 'error');
        }
    })();

});