// Contrato puro de la entrevista impresa (paso E12): título, datos del
// aspirante y de la entrevista en el orden del anexo, y firmas. Sin HTTP, sin
// React, sin DOM. Las preguntas del anexo las arma
// `utils/cuestionarioAdmision.js` (`entrevistaParaImprimir`).
//
// Sale lo **guardado**: la pantalla no deja imprimir con cambios sin guardar,
// porque lo que firma la familia debe ser igual a lo que queda en el sistema.
// Lo vacío sale en blanco, para escribirlo a mano. El resultado (aprobado o
// no) no sale: el anexo en papel no lo tiene y es un papel que firma la
// familia.

export const TITULO_ENTREVISTA = "Entrevista de admisión";

const texto = (valor) => (valor === null || valor === undefined ? "" : String(valor).trim());

const unidos = (partes, separador = " ") => partes.map(texto).filter(Boolean).join(separador);

// "2026-10-20" → "20/10/2026". Se parte el texto en vez de usar `Date`, para
// que la zona horaria no corra el día.
export function fechaLegible(valor) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto(valor));
  if (!coincidencia) return "";
  const [, anio, mes, dia] = coincidencia;
  return `${dia}/${mes}/${anio}`;
}

export const subtituloEntrevista = (admision) =>
  `${unidos([admision.nombre, admision.apellido])} · Admisión ${admision.anio}`;

const fila = (etiqueta, valor, largo = false) => ({ etiqueta, valor: texto(valor), largo });

// `{ secciones: [{ titulo, filas: [{ etiqueta, valor, largo }] }],
//    observaciones }`. Las observaciones van aparte: en el anexo cierran el
// documento, después de las preguntas.
export function datosEntrevistaParaImprimir(admision) {
  const autorizacion = admision.autoriza_datos
    ? unidos(["Sí, autorizó", admision.autoriza_nombre])
    : "";

  return {
    secciones: [
      {
        titulo: "Aspirante",
        filas: [
          fila("Nombre y apellidos", unidos([admision.nombre, admision.apellido])),
          fila("Documento", unidos([admision.tipo_documento, admision.documento_identidad])),
          fila("Fecha de nacimiento", fechaLegible(admision.fecha_nacimiento)),
          fila(
            "Curso al que aspira",
            // Sin curso, la jornada sola no dice nada.
            texto(admision.curso_nombre)
              ? unidos([admision.curso_nombre, admision.curso_jornada], " · ")
              : "",
          ),
        ],
      },
      {
        titulo: "Acudiente",
        filas: [
          fila("Nombre", admision.acudiente_nombre),
          fila("Parentesco", admision.acudiente_parentesco),
          fila("Teléfono", admision.acudiente_telefono),
        ],
      },
      {
        titulo: "Autorización de datos",
        filas: [fila("Autorización de datos personales (Ley 1581 de 2012)", autorizacion)],
      },
      {
        titulo: "Entrevista",
        filas: [
          fila("Fecha de la entrevista", fechaLegible(admision.fecha_entrevista)),
          fila("Quién entrevistó", admision.entrevistador),
          fila("Quiénes asistieron", admision.asistentes),
        ],
      },
      {
        titulo: "Estudios anteriores",
        filas: [
          fila("Colegio anterior", admision.colegio_anterior),
          fila("Año cursado", admision.anio_cursado_anterior),
          fila("Preescolar", admision.pre_escolar_anterior),
          fila("EBP", admision.ebp_anterior),
          fila("Paz y salvo", admision.paz_salvo_anterior),
          fila("Motivo del retiro", admision.motivo_retiro_anterior, true),
        ],
      },
      {
        titulo: "Familia",
        filas: [
          fila("Ocupación del padre", admision.ocupacion_padre),
          fila("Ocupación de la madre", admision.ocupacion_madre),
          fila("Con quién vive el aspirante", admision.vive_con),
          fila("Por qué eligen el colegio y qué esperan", admision.expectativas, true),
        ],
      },
    ],
    observaciones: texto(admision.observaciones),
  };
}

// Firman la familia (quien autorizó los datos, o el acudiente) y quien
// entrevistó; sin nombre, queda solo la raya y el cargo.
export const firmasEntrevista = (admision) => [
  {
    nombre: texto(admision.autoriza_nombre) || texto(admision.acudiente_nombre),
    cargo: "Padre, madre o acudiente",
  },
  { nombre: texto(admision.entrevistador), cargo: "Quien entrevistó" },
];
