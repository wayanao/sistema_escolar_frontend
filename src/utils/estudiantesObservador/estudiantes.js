import { DATOS_DE_ADMISION_EN_LA_FICHA } from "../../constants/documentosEstudiante";

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
};

export function crearEstudianteInicial() {
  return { ...ESTUDIANTE_INICIAL };
}

export function obtenerEtiquetaEstadoEstudiante(estado) {
  return (
    ESTADOS_ESTUDIANTE.find((item) => item.value === estado)?.label || "Activo"
  );
}

export function limpiarPayloadEstudiante(estudiante) {
  return Object.fromEntries(
    Object.entries(estudiante).map(([campo, valor]) => [
      campo,
      valor === "" ? null : valor,
    ]),
  );
}

export function normalizarEstudianteParaEdicion(estudiante) {
  const estudianteLimpio = Object.fromEntries(
    Object.entries(estudiante).map(([campo, valor]) => [
      campo,
      valor === null ? "" : valor,
    ]),
  );

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
