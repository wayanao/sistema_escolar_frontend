import { DATOS_DE_ADMISION_EN_LA_FICHA } from "../../constants/documentosEstudiante";
import { SUBGRUPOS_SISBEN } from "../../constants/sisben";
import { capitalizarNombreVisible, capitalizarPalabras, primeraMayuscula } from "../nombres";
import { obtenerValoracion } from "../valoracionesDesarrollo";

export const ESTADOS_ESTUDIANTE = [
  { value: "activo", label: "Activo" },
  { value: "retirado", label: "Retirado" },
  { value: "egresado", label: "Egresado" },
  { value: "inactivo", label: "Inactivo" },
];

export const FILTROS_ESTUDIANTE = [
  ...ESTADOS_ESTUDIANTE,
  { value: "todos", label: "Todos" },
];

const ESTUDIANTE_INICIAL = {
  nombre: "",
  apellido: "",
  tipo_documento: "",
  documento_identidad: "",
  lugar_expedicion: "",
  fecha_nacimiento: "",
  direccion: "",
  telefono: "",
  email: "",
  curso_id: "",
  descuento_matricula: 0,
  descuento_mensualidad: 0,
  datos_medicos: "",
  eps: "",
  estrato: "",
  jornada: "",
  colegio_anterior: "",
  anio_cursado_anterior: "",
  pre_escolar_anterior: "",
  ebp_anterior: "",
  motivo_retiro_anterior: "",
  paz_salvo_anterior: "",
  nombre_padre: "",
  tipo_documento_padre: "",
  documento_padre: "",
  telefono_padre: "",
  ocupacion_padre: "",
  nombre_madre: "",
  tipo_documento_madre: "",
  documento_madre: "",
  telefono_madre: "",
  ocupacion_madre: "",
  contacto_emergencia: "",
  // SISBÉN y lugar de residencia (docs/funcionalidades/SISBEN_RESIDENCIA.md).
  sisben: "",
  sisben_grupo: "",
  sisben_subgrupo: "",
  sisben_nivel: "",
  barrio: "",
  municipio: "",
  zona_residencia: "",
  punto_referencia: "",
};

export function crearEstudianteInicial() {
  return { ...ESTUDIANTE_INICIAL };
}

// El formulario guarda el SISBÉN como "si", "no" o "" (sin dato); el backend,
// como true, false o null.
const SISBEN_PARA_EL_BACKEND = { si: true, no: false };

// Lo que depende del SISBÉN se vacía cuando deja de tener sentido: sin SISBÉN
// no hay grupo, subgrupo ni nivel, y el subgrupo es de un solo grupo. El
// backend rechaza lo contrario.
export function actualizarCampoEstudiante(estudiante, campo, valor) {
  const siguiente = { ...estudiante, [campo]: valor };
  if (campo === "sisben" && valor !== "si") {
    siguiente.sisben_grupo = "";
    siguiente.sisben_subgrupo = "";
    siguiente.sisben_nivel = "";
  }
  if (
    campo === "sisben_grupo" &&
    !SUBGRUPOS_SISBEN[valor]?.includes(siguiente.sisben_subgrupo)
  ) {
    siguiente.sisben_subgrupo = "";
  }
  return siguiente;
}

export function obtenerEtiquetaEstadoEstudiante(estado) {
  return (
    ESTADOS_ESTUDIANTE.find((item) => item.value === estado)?.label || "Activo"
  );
}

// Mayúsculas al guardar (pedido del usuario el 2026-11-05). Los nombres de
// personas, con mayúscula inicial en cada palabra, como se ven en las listas
// («maría del pilar» → «María Del Pilar»). Los lugares, con mayúscula al
// inicio de cada palabra y el resto como se escribió («bogotá D.C.» →
// «Bogotá D.C.»). Direcciones, documentos y lo demás van como se escriben.
const CAMPOS_NOMBRE_PERSONA = new Set(["nombre", "apellido", "nombre_padre", "nombre_madre"]);
// Lugares y nombres propios: mayúscula en cada palabra, el resto como se
// escribió. El contacto de emergencia es un nombre con su teléfono.
const CAMPOS_CADA_PALABRA = new Set([
  "lugar_expedicion",
  "municipio",
  "barrio",
  "colegio_anterior",
  "eps",
  "contacto_emergencia",
]);
// Textos libres, con la primera letra en mayúscula. Incluye lo que llega de la
// entrevista de admisión (motivo del retiro, ocupaciones...), que se escribe
// allá con la misma regla. El paz y salvo es "SI" o "NO" y no se toca.
const CAMPOS_TEXTO_LIBRE = new Set([
  "datos_medicos",
  "punto_referencia",
  "anio_cursado_anterior",
  "pre_escolar_anterior",
  "ebp_anterior",
  "motivo_retiro_anterior",
  "ocupacion_padre",
  "ocupacion_madre",
]);

function textoParaGuardar(campo, valor) {
  if (typeof valor !== "string") return valor;
  if (CAMPOS_NOMBRE_PERSONA.has(campo)) return capitalizarNombreVisible(valor);
  if (CAMPOS_CADA_PALABRA.has(campo)) return capitalizarPalabras(valor);
  if (CAMPOS_TEXTO_LIBRE.has(campo)) return primeraMayuscula(valor);
  return valor;
}

export function limpiarPayloadEstudiante(estudiante) {
  const payload = Object.fromEntries(
    Object.entries(estudiante).map(([campo, valor]) => {
      const limpio = textoParaGuardar(campo, valor);
      return [campo, limpio === "" ? null : limpio];
    }),
  );

  if ("sisben" in payload && typeof payload.sisben !== "boolean") {
    payload.sisben = SISBEN_PARA_EL_BACKEND[payload.sisben] ?? null;
  }
  if (payload.sisben_nivel !== null && payload.sisben_nivel !== undefined) {
    payload.sisben_nivel = Number(payload.sisben_nivel);
  }

  return payload;
}

export function normalizarEstudianteParaEdicion(estudiante) {
  const estudianteLimpio = Object.fromEntries(
    Object.entries(estudiante).map(([campo, valor]) => [
      campo,
      valor === null ? "" : valor,
    ]),
  );

  if (typeof estudianteLimpio.sisben === "boolean") {
    estudianteLimpio.sisben = estudianteLimpio.sisben ? "si" : "no";
  }
  if (typeof estudianteLimpio.sisben_nivel === "number") {
    estudianteLimpio.sisben_nivel = String(estudianteLimpio.sisben_nivel);
  }

  delete estudianteLimpio.id;
  delete estudianteLimpio.estado;
  delete estudianteLimpio.anio_escolar;

  return estudianteLimpio;
}

export function filtrarEstudiantesAdmin(estudiantes, busqueda) {
  const termino = busqueda.toLowerCase();

  return estudiantes.filter(
    (estudiante) =>
      estudiante.nombre.toLowerCase().includes(termino) ||
      estudiante.apellido.toLowerCase().includes(termino) ||
      estudiante.email?.toLowerCase().includes(termino) ||
      estudiante.documento?.toLowerCase().includes(termino),
  );
}

export function filtrarEstudiantesObservador(estudiantes, busqueda) {
  const termino = busqueda.toLowerCase();

  return estudiantes.filter((estudiante) =>
    `${estudiante.nombre.trim()} ${estudiante.apellido.trim()}`
      .toLowerCase()
      .includes(termino),
  );
}

export function normalizarDetalleEstudiante(detallesBase, deudasData) {
  const deudas = deudasData.deudas || detallesBase.deudas || [];
  const deudaAniosAnteriores =
    deudasData.deuda_anios_anteriores ||
    detallesBase.deuda_anios_anteriores ||
    [];

  return {
    notas: [],
    promedio_general: 0,
    inasistencias: 0,
    observaciones: [],
    productos_inventario: [],
    ...detallesBase,
    deudas,
    deuda_anios_anteriores: deudaAniosAnteriores,
    total_deuda:
      deudasData.total_deuda ??
      detallesBase.total_deuda ??
      deudas.reduce(
        (total, deuda) => total + Number(deuda.deuda || 0),
        0,
      ),
    notas_por_periodo: normalizarNotasPorPeriodo(detallesBase.notas_por_periodo),
    inasistencias_por_periodo: normalizarInasistenciasPorPeriodo(
      detallesBase.inasistencias_por_periodo,
    ),
  };
}

// Notas por periodo en el resumen (docs/funcionalidades/NOTAS_RESUMEN_ESTUDIANTE.md).
// El backend manda los cuatro periodos y el año de una vez; aquí no se
// calcula ninguna nota, solo se lee y se traduce la carita a su nombre.
// Sin `notas_por_periodo` (un backend anterior), los dos campos quedan en
// `null` y la ficha se ve como antes.
export const PERIODOS_RESUMEN = ["1", "2", "3", "4"];
export const PERIODO_RESUMEN_ANIO = "anio";
export const OPCIONES_PERIODO_RESUMEN = [
  ...PERIODOS_RESUMEN.map((periodo) => ({ value: periodo, label: `Periodo ${periodo}` })),
  { value: PERIODO_RESUMEN_ANIO, label: "Todo el año" },
];
// El color de siempre de la ficha: verde desde 3,0.
const NOTA_APROBATORIA = 3;
const CLAVES_RESUMEN = [...PERIODOS_RESUMEN, PERIODO_RESUMEN_ANIO];

const numeroONulo = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

function normalizarCeldaResumen(celda) {
  if (!celda || typeof celda !== "object") return null;
  const nota = numeroONulo(celda.nota);
  const valoracion = typeof celda.valoracion === "string" ? celda.valoracion : null;
  if (nota === null && !valoracion) return null;
  return { nota, valoracion };
}

function normalizarNotasPorPeriodo(valor) {
  if (!valor || !Array.isArray(valor.materias)) return null;
  return {
    materias: valor.materias.map((materia) => ({
      materia: String(materia?.materia ?? ""),
      tipo_evaluacion: materia?.tipo_evaluacion === "desarrollo" ? "desarrollo" : "numerica",
      periodos: Object.fromEntries(
        PERIODOS_RESUMEN.map((periodo) => [
          periodo,
          normalizarCeldaResumen(materia?.periodos?.[periodo]),
        ]),
      ),
      anio: normalizarCeldaResumen(materia?.anio),
    })),
    promedio: Object.fromEntries(
      CLAVES_RESUMEN.map((clave) => [clave, numeroONulo(valor.promedio?.[clave])]),
    ),
  };
}

function normalizarInasistenciasPorPeriodo(valor) {
  if (!valor || typeof valor !== "object") return null;
  return Object.fromEntries(
    CLAVES_RESUMEN.map((clave) => [clave, numeroONulo(valor[clave]) ?? 0]),
  );
}

/** El último periodo con alguna nota; sin ninguna, el Periodo 1. */
export function ultimoPeriodoConNotas(notasPorPeriodo) {
  const materias = notasPorPeriodo?.materias || [];
  const conNotas = PERIODOS_RESUMEN.filter((periodo) =>
    materias.some((materia) => materia.periodos[periodo] !== null),
  );
  return conNotas.at(-1) || PERIODOS_RESUMEN[0];
}

function filaDeMateria(materia, celda) {
  if (!celda) return { materia: materia.materia, texto: "Sin nota", tono: "sin_nota" };
  if (materia.tipo_evaluacion === "desarrollo") {
    const opcion = obtenerValoracion(celda.valoracion);
    return {
      materia: materia.materia,
      texto: opcion ? `${opcion.emoji} ${opcion.label}` : "Sin nota",
      tono: opcion ? "carita" : "sin_nota",
    };
  }
  return {
    materia: materia.materia,
    texto: celda.nota.toFixed(1),
    tono: celda.nota >= NOTA_APROBATORIA ? "aprobada" : "reprobada",
  };
}

/**
 * Lo que muestra la tarjeta "Rendimiento" para un periodo ("1" a "4") o
 * para "anio": el promedio general (solo con materias numéricas), las
 * inasistencias y una fila por materia, en el orden del boletín.
 */
export function rendimientoDelPeriodo(detalles, periodo) {
  const clave = CLAVES_RESUMEN.includes(periodo) ? periodo : PERIODOS_RESUMEN[0];
  const materias = detalles?.notas_por_periodo?.materias || [];
  const celdaDe = (materia) =>
    clave === PERIODO_RESUMEN_ANIO ? materia.anio : materia.periodos[clave];
  const promedio = detalles?.notas_por_periodo?.promedio?.[clave] ?? null;

  return {
    promedio:
      promedio === null
        ? null
        : { texto: promedio.toFixed(1), aprobado: promedio >= NOTA_APROBATORIA },
    inasistencias: detalles?.inasistencias_por_periodo?.[clave] ?? 0,
    materias: materias.map((materia) => filaDeMateria(materia, celdaDe(materia))),
    hayNotas: materias.some((materia) => celdaDe(materia) !== null),
  };
}

// Paso E6 de la entrevista de admisión: lo que pasó a la entrevista, para
// verlo de solo lectura en la ficha ("Datos de admisión"). Un vacío es null.
export function datosDeAdmisionEstudiante(estudiante) {
  return DATOS_DE_ADMISION_EN_LA_FICHA.map(({ campo, etiqueta }) => {
    const valor = estudiante?.[campo];
    const texto = valor === null || valor === undefined ? "" : String(valor).trim();
    return { campo, etiqueta, valor: texto === "" ? null : texto };
  });
}
