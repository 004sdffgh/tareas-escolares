/**
 * Gestor de tareas escolares
 * Actividad 3 - Laboratorio de Programación Web (FIME, UANL)
 *
 * Qué hace: permite agregar, ver, editar y eliminar tareas, marcarlas como
 * completadas, buscarlas, filtrarlas y ordenarlas. Los datos se guardan en
 * localStorage, así que siguen ahí al recargar la página o volver otro día.
 *
 * Organización del archivo:
 *   1. Constantes y estado         5. Operaciones sobre los datos (CRUD)
 *   2. Referencias al DOM          6. Filtros y orden
 *   3. Utilidades                  7. Pintar la interfaz (render)
 *   4. Persistencia y validación   8. Eventos e inicio
 */
'use strict';

/* ==========================================================
   1. CONSTANTES Y ESTADO
   ========================================================== */
const CLAVE_ALMACEN = 'gestorTareas.v1';
const MATERIAS = ['Programación Web', 'Cálculo', 'Física', 'Bases de datos', 'Inglés', 'Otra'];
const PRIORIDADES = {
    alta:  { texto: 'Alta',  peso: 1 },
    media: { texto: 'Media', peso: 2 },
    baja:  { texto: 'Baja',  peso: 3 },
};
const CAMPOS = ['titulo', 'materia', 'fecha', 'prioridad', 'notas'];

// Cada tarea es un objeto: { id, titulo, materia, fecha, prioridad, notas, completada, creada }
let tareas = [];
let idEditando = null;   // null = el formulario está en modo "agregar"

/* ==========================================================
   2. REFERENCIAS AL DOM
   ========================================================== */
const $ = (selector) => document.querySelector(selector);

const dom = {
    form: $('#form-tarea'),
    tituloForm: $('#titulo-form'),
    titulo: $('#titulo'),
    materia: $('#materia'),
    fecha: $('#fecha'),
    prioridad: $('#prioridad'),
    notas: $('#notas'),
    mensajeForm: $('#mensaje-form'),
    btnGuardar: $('#btn-guardar'),
    btnCancelar: $('#btn-cancelar'),
    buscar: $('#buscar'),
    filtroEstado: $('#filtro-estado'),
    filtroMateria: $('#filtro-materia'),
    orden: $('#orden'),
    lista: $('#lista'),
    estadoLista: $('#estado-lista'),
    btnLimpiar: $('#btn-limpiar'),
    anuncio: $('#anuncio'),
    contTotal: $('#cont-total'),
    contPendientes: $('#cont-pendientes'),
    contCompletadas: $('#cont-completadas'),
    contVencidas: $('#cont-vencidas'),
    progreso: $('#progreso'),
    textoProgreso: $('#texto-progreso'),
    porMateria: $('#por-materia'),
};

/* ==========================================================
   3. UTILIDADES
   ========================================================== */

// Fecha de hoy como "AAAA-MM-DD" usando la hora local (no UTC)
const hoyISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const nuevoId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const formatearFecha = (iso) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

const estaVencida = (tarea) => !tarea.completada && tarea.fecha < hoyISO();

// Crea un elemento del DOM. Usa textContent, así que lo que escriba el usuario nunca se interpreta como HTML.
function crear(etiqueta, { clase, texto, atributos = {} } = {}, ...hijos) {
    const nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    Object.entries(atributos).forEach(([nombre, valor]) => nodo.setAttribute(nombre, valor));
    hijos.forEach((hijo) => nodo.append(hijo));
    return nodo;
}

const anunciar = (mensaje) => { dom.anuncio.textContent = mensaje; };

/* ==========================================================
   4. PERSISTENCIA (localStorage) Y VALIDACIÓN
   ========================================================== */
const esTareaValida = (t) =>
    t !== null && typeof t === 'object' &&
    typeof t.id === 'string' && typeof t.titulo === 'string' &&
    typeof t.fecha === 'string' && typeof t.completada === 'boolean' &&
    typeof t.prioridad === 'string' && t.prioridad in PRIORIDADES;

function guardarTareas() {
    try {
        localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(tareas));
    } catch (error) {
        console.warn('No se pudo guardar en localStorage:', error);
        anunciar('Aviso: no se pudieron guardar los cambios en este navegador.');
    }
}

function cargarTareas() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_ALMACEN) ?? '[]');
        return Array.isArray(datos)
            ? datos.filter(esTareaValida).map((t) => ({ notas: '', materia: 'Otra', creada: 0, ...t }))
            : [];
    } catch (error) {
        console.warn('No se pudieron leer las tareas guardadas:', error);
        return [];
    }
}

const leerFormulario = () => ({
    titulo: dom.titulo.value.trim(),
    materia: dom.materia.value,
    fecha: dom.fecha.value,
    prioridad: dom.prioridad.value,
    notas: dom.notas.value.trim(),
});

// Devuelve un objeto { campo: 'mensaje de error' }; si está vacío, los datos son válidos
function validarTarea(datos) {
    const errores = {};

    if (datos.titulo.length < 3) {
        errores.titulo = 'El título es obligatorio y debe tener al menos 3 caracteres.';
    } else if (datos.titulo.length > 60) {
        errores.titulo = 'El título no puede pasar de 60 caracteres.';
    } else if (tareas.some((t) => t.id !== idEditando &&
               t.titulo.toLowerCase() === datos.titulo.toLowerCase() && t.fecha === datos.fecha)) {
        errores.titulo = 'Ya existe una tarea con ese título y esa fecha de entrega.';
    }

    if (!MATERIAS.includes(datos.materia)) {
        errores.materia = 'Elige una materia de la lista.';
    }

    if (!datos.fecha) {
        errores.fecha = 'Elige la fecha de entrega.';
    } else if (idEditando === null && datos.fecha < hoyISO()) {
        errores.fecha = 'La fecha de entrega no puede ser anterior a hoy.';
    }

    if (!(datos.prioridad in PRIORIDADES)) {
        errores.prioridad = 'Elige una prioridad.';
    }

    if (datos.notas.length > 200) {
        errores.notas = 'Las notas no pueden pasar de 200 caracteres.';
    }
    return errores;
}

function mostrarErrores(errores) {
    CAMPOS.forEach((campo) => {
        $(`#error-${campo}`).textContent = errores[campo] ?? '';
        if (errores[campo]) dom[campo].setAttribute('aria-invalid', 'true');
        else dom[campo].removeAttribute('aria-invalid');
    });
    const total = Object.keys(errores).length;
    dom.mensajeForm.textContent = total > 0
        ? `No se pudo guardar: revisa ${total === 1 ? 'el campo marcado' : `los ${total} campos marcados`}.`
        : '';
    dom.mensajeForm.classList.toggle('con-error', total > 0);
}

/* ==========================================================
   5. OPERACIONES SOBRE LOS DATOS (CRUD)
   ========================================================== */
function agregarTarea(datos) {
    tareas.push({ id: nuevoId(), ...datos, completada: false, creada: Date.now() });
}

function actualizarTarea(id, datos) {
    tareas = tareas.map((t) => (t.id === id ? { ...t, ...datos } : t));
}

function eliminarTarea(id) {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea || !confirm(`¿Eliminar la tarea «${tarea.titulo}»?`)) return;
    tareas = tareas.filter((t) => t.id !== id);
    if (idEditando === id) salirDeEdicion();
    anunciar(`Tarea «${tarea.titulo}» eliminada.`);
    refrescar();
}

function alternarCompletada(id) {
    tareas = tareas.map((t) => (t.id === id ? { ...t, completada: !t.completada } : t));
    const tarea = tareas.find((t) => t.id === id);
    anunciar(`Tarea «${tarea.titulo}» marcada como ${tarea.completada ? 'completada' : 'pendiente'}.`);
    refrescar();
}

function eliminarCompletadas() {
    const cantidad = tareas.filter((t) => t.completada).length;
    if (cantidad === 0 || !confirm(`¿Eliminar las ${cantidad} tareas completadas?`)) return;
    tareas = tareas.filter((t) => !t.completada);
    anunciar(`Se eliminaron ${cantidad} tareas completadas.`);
    refrescar();
}

/* ==========================================================
   6. FILTROS Y ORDEN
   ========================================================== */
const FILTROS_ESTADO = {
    todas: () => true,
    pendientes: (t) => !t.completada,
    completadas: (t) => t.completada,
    vencidas: estaVencida,
};

const COMPARADORES = {
    fecha: (a, b) => a.fecha.localeCompare(b.fecha) || a.creada - b.creada,
    prioridad: (a, b) => PRIORIDADES[a.prioridad].peso - PRIORIDADES[b.prioridad].peso || a.fecha.localeCompare(b.fecha),
    titulo: (a, b) => a.titulo.localeCompare(b.titulo, 'es'),
    reciente: (a, b) => b.creada - a.creada,
};

function obtenerVisibles() {
    const texto = dom.buscar.value.trim().toLowerCase();
    const materia = dom.filtroMateria.value;
    return tareas
        .filter((t) => !texto || `${t.titulo} ${t.notas}`.toLowerCase().includes(texto))
        .filter(FILTROS_ESTADO[dom.filtroEstado.value])
        .filter((t) => materia === 'todas' || t.materia === materia)
        .sort(COMPARADORES[dom.orden.value]);
}

/* ==========================================================
   7. PINTAR LA INTERFAZ
   ========================================================== */
function rellenarMaterias() {
    dom.materia.append(crear('option', { texto: '— Selecciona una materia —', atributos: { value: '' } }));
    MATERIAS.forEach((m) => dom.materia.append(crear('option', { texto: m, atributos: { value: m } })));
    dom.filtroMateria.append(crear('option', { texto: 'Todas', atributos: { value: 'todas' } }));
    MATERIAS.forEach((m) => dom.filtroMateria.append(crear('option', { texto: m, atributos: { value: m } })));
}

function crearTarjeta(t) {
    const vencida = estaVencida(t);
    const casilla = crear('input', { atributos: { type: 'checkbox', 'data-accion': 'completar', 'data-id': t.id } });
    casilla.checked = t.completada;

    const etiquetas = crear('p', { clase: 'etiquetas' },
        crear('span', { clase: `etiqueta prioridad-${t.prioridad}`, texto: `Prioridad ${PRIORIDADES[t.prioridad].texto}` }),
        crear('span', { clase: 'etiqueta', texto: t.materia }),
        crear('span', { clase: `etiqueta${vencida ? ' vencida' : ''}`, texto: `${vencida ? 'Vencida · ' : 'Entrega: '}${formatearFecha(t.fecha)}` }),
    );

    const acciones = crear('div', { clase: 'acciones' },
        crear('button', { clase: 'btn secundario', texto: 'Editar',
            atributos: { type: 'button', 'data-accion': 'editar', 'data-id': t.id, 'aria-label': `Editar la tarea ${t.titulo}` } }),
        crear('button', { clase: 'btn peligro', texto: 'Eliminar',
            atributos: { type: 'button', 'data-accion': 'eliminar', 'data-id': t.id, 'aria-label': `Eliminar la tarea ${t.titulo}` } }),
    );

    return crear('li', { clase: `tarea${t.completada ? ' completada' : ''}${vencida ? ' vencida' : ''}` },
        crear('label', { clase: 'tarea-titulo' }, casilla, crear('span', { texto: t.titulo })),
        etiquetas,
        ...(t.notas ? [crear('p', { clase: 'notas', texto: t.notas })] : []),
        acciones,
    );
}

function renderLista() {
    const visibles = obtenerVisibles();
    dom.lista.replaceChildren(...visibles.map(crearTarjeta));

    if (tareas.length === 0) {
        dom.estadoLista.textContent = 'Aún no tienes tareas. Agrega la primera con el formulario.';
    } else if (visibles.length === 0) {
        dom.estadoLista.textContent = 'Ninguna tarea coincide con la búsqueda o los filtros.';
    } else {
        dom.estadoLista.textContent = `Mostrando ${visibles.length} de ${tareas.length} tareas.`;
    }
    dom.btnLimpiar.hidden = !tareas.some((t) => t.completada);
}

function renderResumen() {
    const total = tareas.length;
    const completadas = tareas.filter((t) => t.completada).length;
    const vencidas = tareas.filter(estaVencida).length;
    const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);

    dom.contTotal.textContent = total;
    dom.contPendientes.textContent = total - completadas;
    dom.contCompletadas.textContent = completadas;
    dom.contVencidas.textContent = vencidas;
    dom.progreso.value = porcentaje;
    dom.textoProgreso.textContent = `${porcentaje}%`;

    // Conteo de tareas por materia con reduce
    const porMateria = tareas.reduce((acc, t) => ({ ...acc, [t.materia]: (acc[t.materia] ?? 0) + 1 }), {});
    const partes = Object.entries(porMateria).map(([materia, n]) => `${materia} (${n})`);
    dom.porMateria.textContent = partes.length ? `Por materia: ${partes.join(' · ')}` : '';
}

// Guarda en localStorage y vuelve a pintar todo
function refrescar({ guardar = true } = {}) {
    if (guardar) guardarTareas();
    renderLista();
    renderResumen();
}

/* ==========================================================
   8. EVENTOS E INICIO
   ========================================================== */
function salirDeEdicion() {
    idEditando = null;
    dom.form.reset();
    mostrarErrores({});
    dom.tituloForm.textContent = 'Agregar tarea';
    dom.btnGuardar.textContent = 'Agregar tarea';
    dom.btnCancelar.hidden = true;
    dom.form.classList.remove('editando');
}

function iniciarEdicion(id) {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea) return;
    idEditando = id;
    dom.titulo.value = tarea.titulo;
    dom.materia.value = tarea.materia;
    dom.fecha.value = tarea.fecha;
    dom.prioridad.value = tarea.prioridad;
    dom.notas.value = tarea.notas;
    mostrarErrores({});
    dom.tituloForm.textContent = 'Editar tarea';
    dom.btnGuardar.textContent = 'Guardar cambios';
    dom.btnCancelar.hidden = false;
    dom.form.classList.add('editando');
    dom.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    dom.titulo.focus();
}

function manejarEnvio(evento) {
    evento.preventDefault();
    const datos = leerFormulario();
    const errores = validarTarea(datos);
    mostrarErrores(errores);

    const camposConError = Object.keys(errores);
    if (camposConError.length > 0) {
        dom[camposConError[0]].focus();
        return;
    }

    if (idEditando === null) {
        agregarTarea(datos);
        anunciar(`Tarea «${datos.titulo}» agregada.`);
    } else {
        actualizarTarea(idEditando, datos);
        anunciar(`Tarea «${datos.titulo}» actualizada.`);
    }
    salirDeEdicion();
    refrescar();
}

function iniciar() {
    rellenarMaterias();
    tareas = cargarTareas();

    dom.form.addEventListener('submit', manejarEnvio);
    dom.btnCancelar.addEventListener('click', () => { salirDeEdicion(); anunciar('Edición cancelada.'); });
    dom.btnLimpiar.addEventListener('click', eliminarCompletadas);

    // Búsqueda, filtros y orden: se vuelve a pintar la lista en cuanto cambian
    dom.buscar.addEventListener('input', renderLista);
    [dom.filtroEstado, dom.filtroMateria, dom.orden].forEach((control) => control.addEventListener('change', renderLista));

    // Delegación de eventos: un solo "oyente" para todos los botones y casillas de la lista
    dom.lista.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button[data-accion]');
        if (!boton) return;
        const { accion, id } = boton.dataset;
        if (accion === 'editar') iniciarEdicion(id);
        if (accion === 'eliminar') eliminarTarea(id);
    });
    dom.lista.addEventListener('change', (evento) => {
        if (evento.target.matches('input[data-accion="completar"]')) alternarCompletada(evento.target.dataset.id);
    });

    refrescar({ guardar: false });
}

document.addEventListener('DOMContentLoaded', iniciar);
