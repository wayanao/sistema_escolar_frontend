// Contrato puro del año lectivo: la lista de años que da el backend
// (`GET /anios-lectivos`), el año activo, las etiquetas, el aviso y, sobre
// todo, `parametrosAnio`.
//
// El backend decide qué año es el activo y qué se puede editar; aquí solo se
// lee lo que él responde. Sin HTTP, sin React, sin DOM y sin almacenamiento.
// Ver docs/funcionalidades/ANIO_LECTIVO.md.

export const ESTADO_PREPARACION = "preparacion";
export const ESTADO_ACTIVO = "activo";
export const ESTADO_CERRADO = "cerrado";
export const ESTADO_REABIERTO = "reabierto";

const ETIQUETAS_ESTADO = {
  [ESTADO_PREPARACION]: "En preparación",
  [ESTADO_ACTIVO]: "Activo",
  [ESTADO_CERRADO]: "Cerrado",
  [ESTADO_REABIERTO]: "Reabierto",
};

// Mirando el año activo no viaja ningún parámetro: así cada petición queda
// idéntica, letra por letra, a la de antes de esta función. Es siempre el
// mismo objeto, congelado, para que un hook que lo use como dependencia no
// vuelva a pedir sus datos sin necesidad.
export const SIN_PARAMETROS_DE_ANIO = Object.freeze({});

// Pantallas del admin que siguen el año elegido. Crece paso a paso: cada paso
// de la fase 4 agrega las suyas cuando ya cargan los datos de ese año, para
// que ninguna muestre un año con los datos de otro. En las demás no aparecen
// ni el selector ni el aviso (decidido con el usuario el 2026-10-03): así,
// por ejemplo en Pagos, nadie cree que el pago va al año que dice arriba.
// `exacta` es para "/admin", que no debe alcanzar a "/admin/pagos".
// `parametro` y `valores` limitan una pantalla con pestañas a las pestañas
// del año: Administración guarda la suya en `?modulo=` (`pages/Admin.jsx`), y
// Profesores y Materias no tienen año.
export const RUTAS_POR_ANIO = Object.freeze([
  // Paso 4.2.
  {
    ruta: "/admin",
    exacta: true,
    parametro: "modulo",
    valores: ["cursos", "asignar-clases", "orden-boletin"],
  },
  { ruta: "/admin/horarios" },
  // Paso 4.3.
  { ruta: "/admin/tipos-pagos" },
  { ruta: "/admin/cartera-vencida" },
  // Paso 4.4.
  { ruta: "/admin/estudiantes" },
  // Paso 4.5.
  { ruta: "/boletin" },
  { ruta: "/admin/certificados" },
  // Paso 4.6. La bandeja de planes incluye el detalle de un plan
  // (`/admin/planeadores-clases/:planId`).
  { ruta: "/admin/listas-seguimiento" },
  { ruta: "/admin/planeadores-clases" },
]);

const esEnteroPositivo = (valor) => Number.isInteger(valor) && valor > 0;

// Marca de salida de quien no sigue el año siguiente (paso 6.6). Son los
// valores de `matriculas.estado_salida` en el backend.
export const SALIDA_RETIRADO = "retirado";
export const SALIDA_EGRESADO = "egresado";

const ETIQUETAS_SALIDA = {
  [SALIDA_RETIRADO]: "Retirado",
  [SALIDA_EGRESADO]: "Egresado",
};

export const etiquetaSalida = (estadoSalida) => ETIQUETAS_SALIDA[estadoSalida] ?? "";

// Un candidato de la promoción se puede seleccionar si todavía no tiene
// matrícula en el año siguiente ni marca de salida. El backend rechaza los
// dos casos; esto solo evita ofrecer lo que de todos modos fallaría.
export const puedeMatricularseEnDestino = (candidato) =>
  !candidato.matriculado_en_destino && !candidato.estado_salida;

// Activación del año (paso 6.7). El código con el que el backend responde un
// 409 cuando quedan estudiantes sin decidir; viene con su lista.
export const CODIGO_ACTIVACION_CON_PENDIENTES = "activacion_con_pendientes";

// Los pendientes de la vista previa agrupados por su curso del año activo, en
// el orden en que llegan (el backend ya los ordena por curso y apellido).
export function agruparPendientesPorCurso(sinDecidir) {
  if (!Array.isArray(sinDecidir)) return [];

  const grupos = new Map();
  for (const estudiante of sinDecidir) {
    const clave = estudiante.curso_id == null ? "sin-curso" : String(estudiante.curso_id);
    if (!grupos.has(clave)) {
      const curso =
        estudiante.curso_id == null
          ? "Sin curso"
          : [estudiante.curso_nombre, estudiante.curso_jornada].filter(Boolean).join(" · ");
      grupos.set(clave, { clave, curso, estudiantes: [] });
    }
    grupos.get(clave).estudiantes.push(estudiante);
  }
  return [...grupos.values()];
}

// El año escrito para confirmar coincide con el que cambia. Es comodidad para
// habilitar el botón: el backend vuelve a compararlo.
export const confirmacionCoincide = (texto, anio) =>
  String(texto ?? "").trim() === String(anio);

// La lista de pendientes de un 409 de activación, o `null` si el error es otro.
export function leerPendientesDeActivacion(error) {
  const detalle = error?.response?.data?.detail;
  if (
    detalle?.codigo === CODIGO_ACTIVACION_CON_PENDIENTES &&
    Array.isArray(detalle.sin_decidir)
  ) {
    return detalle.sin_decidir;
  }
  return null;
}

// El mensaje del backend, que llega como texto o, en los avisos con código,
// como `{ codigo, mensaje }`. Si no hay ninguno, el de respaldo.
export function mensajeDeErrorAnio(error, respaldo) {
  const detalle = error?.response?.data?.detail;
  if (typeof detalle === "string" && detalle.trim()) return detalle;
  if (typeof detalle?.mensaje === "string" && detalle.mensaje.trim()) {
    return detalle.mensaje;
  }
  return respaldo;
}

// Años pasados (paso 6.8): los cerrados y el reabierto, en el orden en que
// llegan, y qué se puede hacer con cada uno.
export const aniosPasados = (anios) =>
  Array.isArray(anios)
    ? anios.filter(
        (anio) => anio.estado === ESTADO_CERRADO || anio.estado === ESTADO_REABIERTO,
      )
    : [];

export function accionDeAnioPasado({ anio, estado }) {
  if (estado === ESTADO_CERRADO) {
    return { accion: "reabrir", etiqueta: `Reabrir ${anio}`, verbo: "reabrir" };
  }
  if (estado === ESTADO_REABIERTO) {
    return {
      accion: "cerrar",
      etiqueta: `Volver a cerrar ${anio}`,
      verbo: "volver a cerrar",
    };
  }
  return null;
}

// `[{ id, anio, estado }]`, en el orden en que llegan (el más reciente
// primero). Descarta lo que no sea una fila válida, en vez de romper la barra.
export function normalizarAniosLectivos(respuesta) {
  if (!Array.isArray(respuesta)) return [];

  return respuesta
    .map((fila) => ({
      id: Number(fila?.id),
      anio: Number(fila?.anio),
      estado: String(fila?.estado ?? ""),
    }))
    .filter(
      (anio) => esEnteroPositivo(anio.id) && esEnteroPositivo(anio.anio) && anio.estado,
    );
}

export const encontrarAnioActivo = (anios) =>
  anios.find((anio) => anio.estado === ESTADO_ACTIVO) ?? null;

export const etiquetaEstadoAnio = (estado) => ETIQUETAS_ESTADO[estado] ?? estado;

// "2026 · Cerrado".
export const etiquetaAnioLectivo = ({ anio, estado }) =>
  `${anio} · ${etiquetaEstadoAnio(estado)}`;

// `{}` mirando el año activo (o sin año elegido); `{ anio_lectivo_id }` solo
// mirando otro. Es la regla que protege producción: con el activo, ninguna
// petición cambia.
export function parametrosAnio(anioSeleccionadoId, anioActivoId) {
  if (anioSeleccionadoId == null || anioSeleccionadoId === anioActivoId) {
    return SIN_PARAMETROS_DE_ANIO;
  }
  return { anio_lectivo_id: anioSeleccionadoId };
}

// Para los servicios: agrega el año a las opciones solo mirando otro año. Con
// el activo devuelve las mismas opciones, así que la llamada al servicio queda
// letra por letra como antes (sin una clave `parametrosAnio` vacía).
export function opcionesConAnio(opciones, parametrosAnio) {
  if (!parametrosAnio || Object.keys(parametrosAnio).length === 0) return opciones;
  return { ...opciones, parametrosAnio };
}

// `ubicacion` es la de React Router: `{ pathname, search }`.
export function esRutaPorAnio({ pathname, search = "" }, rutas) {
  const consulta = new URLSearchParams(search);

  return rutas.some(({ ruta, exacta, parametro, valores }) => {
    const coincide = exacta
      ? pathname === ruta
      : pathname === ruta || pathname.startsWith(`${ruta}/`);
    return coincide && (!parametro || valores.includes(consulta.get(parametro)));
  });
}

// Espejo de `ESTADOS_EDITABLES_POR_ADMIN` del backend
// (`app/services/anio_lectivo.py`): además del activo, el admin guarda en un
// año en preparación o reabierto; en uno cerrado, nadie.
const ESTADOS_EDITABLES_POR_ADMIN = new Set([ESTADO_PREPARACION, ESTADO_REABIERTO]);

const PERMISOS_ANIO_ACTIVO = Object.freeze({ esAnioActivo: true, puedeEditar: true });

// Qué botones mostrar mirando un año (decidido con el usuario el 2026-10-03):
// en el activo, como siempre; en uno en preparación o reabierto, editar lo que
// ya existe; en uno cerrado o desconocido, solo consultar. Desde la fase 5,
// Cursos y Tipos de pago permiten además crear en `preparacion` enviando el id
// de ese año. Es comodidad: quien de verdad lo garantiza es el backend.
export function permisosAnio(anioSeleccionado, anioActivo) {
  if (!anioSeleccionado || !anioActivo || anioSeleccionado.id === anioActivo.id) {
    return PERMISOS_ANIO_ACTIVO;
  }
  return {
    esAnioActivo: false,
    puedeEditar: ESTADOS_EDITABLES_POR_ADMIN.has(anioSeleccionado.estado),
  };
}

function mensajeAvisoAnio({ anio, estado }) {
  if (estado === ESTADO_PREPARACION) return `Estás preparando el año ${anio}.`;
  if (estado === ESTADO_CERRADO) {
    return `Estás viendo el año ${anio} (cerrado). Solo consulta.`;
  }
  return `Estás viendo el año ${anio} (${etiquetaEstadoAnio(estado).toLowerCase()}).`;
}

// El aviso debajo de la navegación cuando el admin mira un año que no es el
// activo, con el texto de su botón para volver. Mirando el activo, `null`.
export function construirAvisoAnio(anioSeleccionado, anioActivo) {
  if (!anioSeleccionado || !anioActivo || anioSeleccionado.id === anioActivo.id) {
    return null;
  }
  return {
    mensaje: mensajeAvisoAnio(anioSeleccionado),
    textoVolver: `Volver a ${anioActivo.anio}`,
  };
}
