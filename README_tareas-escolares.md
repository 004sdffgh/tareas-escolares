Gestor de tareas escolares

Aplicación web hecha con HTML, CSS y JavaScript moderno (ES6+) para administrar tareas escolares sin depender de un servidor. Proyecto de la Actividad 3 del Laboratorio de Programación Web (FIME, UANL).
Objetivo
Desarrollar una aplicación del lado del cliente que permita registrar, modificar y conservar datos entre sesiones, aplicando manipulación del DOM, eventos, validación de datos y persistencia con localStorage.

Funcionalidades

- Agregar tareas con título, materia, fecha de entrega, prioridad y notas.
- Visualizar las tareas en una lista que se actualiza al instante, sin recargar la página.
- Editar una tarea (el formulario se llena con sus datos) y eliminarla (con confirmación).
- Marcar tareas como completadas o pendientes.
- Buscar por título o notas, filtrar por estado (pendientes, completadas, vencidas) y por materia, y ordenar por fecha, prioridad, título o más recientes.
- Resumen automático: contadores (total, pendientes, completadas, vencidas), porcentaje de avance y número de tareas por materia.
- Persistencia: los datos se guardan en localStorage y siguen ahí al recargar la página o volver otro día.
- Interfaz responsiva y accesible.

Cómo cumple cada punto de la actividad

| Requisito | Dónde se cumple |
|---|---|
| Aplicación tipo gestor de tareas | Gestor de tareas escolares |
| Datos con objetos y arreglos | Arreglo tareas de objetos (ver "Modelo de datos") |
| Agregar, visualizar, editar y eliminar | agregarTarea, renderLista, actualizarTarea, eliminarTarea en app.js |
| Manipular el DOM sin recargar | crear(), replaceChildren, prepend, textContent y classList actualizan la interfaz |
| Eventos y funciones; sintaxis moderna | addEventListener, delegación de eventos, let/const, template literals, arrow functions, desestructuración, spread, ??, y métodos de arreglos map, filter, sort, reduce, find, some |
| Validación con mensajes claros | validarTarea y mostrarErrores (ver "Validaciones") |
| Guardar y recuperar con localStorage | guardarTareas y cargarTareas |
| Función adicional | Búsqueda, filtros, ordenamiento, contadores, categorías (materias) y porcentaje de avance |

Tecnologías
- HTML5 semántico (header, main, section, footer, form, label).
- CSS3 con variables, Grid y Flexbox, y un breakpoint a 800 px.
- JavaScript ES6+ sin librerías ni frameworks.
- localStorage para la persistencia.
- Git y GitHub.

Estructura de archivos

text
tareas-escolares/
├── index.html     Estructura de la página
├── style.css      Estilos y diseño responsivo
├── app.js         Lógica de la aplicación (organizada en 8 secciones)
├── README.md
└──capturas/      Imágenes usadas en este documento

 Modelo de datos
Cada tarea es un objeto y todas se guardan en un arreglo:

js
{
  id: m2x9k1a4b,            
  titulo: "Práctica 3 de JavaScript",
  materia: "Programación Web",
  fecha: "2026-11-11",    
  prioridad: "alta",       
  notas: "Subir los 4 programas y el reporte.",
  completada: false,
  creada: 1794200000000      
}


Validaciones
Los datos se validan antes de guardarlos y cada error aparece junto al campo correspondiente, con un mensaje general arriba del formulario. El primer campo con error recibe el foco.

| Campo | Regla |

| Título | Obligatorio, de 3 a 60 caracteres, y no puede repetirse con la misma fecha de entrega |
| Materia | Debe elegirse una de la lista |
| Fecha | Obligatoria; al agregar no puede ser anterior a hoy |
| Prioridad | Debe ser alta, media o baja |
| Notas | Opcionales, máximo 200 caracteres |

Además, el texto que escribe el usuario se inserta con textContent, por lo que nunca se interpreta como HTML. Si los datos guardados en localStorage están dañados, la aplicación los ignora y arranca vacía en lugar de fallar.

Accesibilidad
- Todos los campos tienen label asociado; los errores se enlazan con aria-describedby y se marcan con aria-invalid.
- Los avisos de cada acción se anuncian en una región role="status".
- Enlace "Saltar a la lista de tareas", foco visible con teclado y botones con aria-label descriptivo.
- Contraste de color legible y diseño que se adapta a pantallas de teléfono.

Cómo usarla
1. Descarga o clona el repositorio.
2. Abre index.html en el navegador (no necesita instalación ni servidor).
3. Llena el formulario y presiona Agregar tarea.
4. Usa los botones Editar y Eliminar, la casilla para completar, y los controles de búsqueda, filtro y orden.

Capturas

Vista general (escritorio)

Vista general(capturas/01-escritorio-lista.png)

Validación del formulario

Validación(capturas/02-validacion.png)

Validación de fecha(capturas/02b-validacion-fecha.png)

Edición de una tarea

Edición(capturas/03-edicion.png)

Búsqueda, filtros y orden

Filtros(capturas/04-filtros.png)

Vista en móvil

Móvil(capturas/05-movil.png)

Pruebas realizadas
- Formulario vacío, título muy corto o muy largo, fecha pasada, notas demasiado largas y tarea duplicada: se rechazan con su mensaje.
- Agregar, editar, completar y eliminar tareas actualiza la lista, los contadores y el avance al momento.
- Búsqueda, filtros y los cuatro ordenamientos devuelven el resultado esperado.
- Al recargar la página, las tareas siguen en su lugar.
- Texto con etiquetas HTML escrito en el formulario se muestra como texto y no se ejecuta.
- Sin desbordes horizontales en anchos de 320, 390, 768 y 1280 px.

Sitio publicado
<https://004sdffgh.github.io/tareas-escolares/>

Repositorio: <https://github.com/004sdffgh/tareas-escolares>

Demostración
Ver el video de la demostración(demostracion.mp4) (2 min 48 s): muestra las validaciones, agregar, editar y eliminar tareas, completar, y la búsqueda, filtros y orden.
