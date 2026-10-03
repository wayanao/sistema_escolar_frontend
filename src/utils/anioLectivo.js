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
export const RUTAS_POR_ANIO = Object.freeze([]);

const esEnteroPositivo = (valor) => Number.isInteger(valor) && valor > 0;

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

export function esRutaPorAnio(pathname, rutas) {
  return rutas.some(({ ruta, exacta }) =>
    exacta ? pathname === ruta : pathname === ruta || pathname.startsWith(`${ruta}/`),
  );
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
