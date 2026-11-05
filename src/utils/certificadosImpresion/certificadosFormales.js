import { formatearPesos } from "../formatoPesos";
import { nombreEstudiante } from "./certificados";

// Certificados con el formato de los modelos del colegio (matrícula, conducta,
// aprobado, paz y salvo y costos educativos): frase de quien firma,
// «CERTIFICA:», un párrafo, dónde y cuándo se expide, y la firma.
// Ver docs/funcionalidades/CERTIFICADOS_NUEVOS.md.

// Cómo se nombra al estudiante en el texto. La ficha no guarda si es niño o
// niña: se elige al imprimir y, sin elegir, el texto queda neutro.
export const TRATAMIENTOS = [
  { value: "neutro", label: "el(la) estudiante", genero: "neutro" },
  { value: "nino", label: "el niño", genero: "masculino" },
  { value: "nina", label: "la niña", genero: "femenino" },
  { value: "estudiante_m", label: "el estudiante", genero: "masculino" },
  { value: "estudiante_f", label: "la estudiante", genero: "femenino" },
];

export const TRATAMIENTO_INICIAL = "neutro";

// Escala nacional de valoración (Decreto 1290 de 2009).
export const DESEMPENOS_CONDUCTA = ["SUPERIOR", "ALTO", "BÁSICO", "BAJO"];

// Lo que falta se deja en una raya, para llenarlo a mano si se imprime así.
const RAYA = "________";

const ABREVIATURAS_DOCUMENTO = {
  "registro civil": "R.C.",
  "tarjeta de identidad": "T.I.",
  "cédula de ciudadanía": "C.C.",
  "cédula de extranjería": "C.E.",
};

const NIVELES = {
  preescolar: "Educación Preescolar",
  primaria: "Educación Básica Primaria",
};

// Con apócope ("veintiún días"), porque van antes de "días".
const DIAS_EN_LETRAS = [
  "", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis",
  "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiún", "veintidós",
  "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete",
  "veintiocho", "veintinueve", "treinta", "treinta y un",
];

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
  "septiembre", "octubre", "noviembre", "diciembre",
];

export function obtenerTratamiento(valor) {
  return TRATAMIENTOS.find((tratamiento) => tratamiento.value === valor) || TRATAMIENTOS[0];
}

// "identificad" → "identificado", "identificada" o "identificado(a)".
export function concordar(raiz, genero) {
  if (genero === "masculino") return `${raiz}o`;
  if (genero === "femenino") return `${raiz}a`;
  return `${raiz}o(a)`;
}

// "Tarjeta de Identidad" y "1.042.268.729" → "T.I. No. 1.042.268.729". Un
// tipo sin abreviatura sale tal cual; sin tipo (u "Otro"), "documento".
export function textoDocumento(tipo, numero) {
  const tipoLimpio = String(tipo ?? "").trim();
  const clave = tipoLimpio.toLowerCase();
  const nombreTipo = ABREVIATURAS_DOCUMENTO[clave]
    || (clave && clave !== "otro" ? tipoLimpio : "documento");
  const numeroLimpio = String(numero ?? "").trim();
  return `${nombreTipo} No. ${numeroLimpio || RAYA}`;
}

export function textoNivel(nivel) {
  return NIVELES[nivel] || "";
}

// "cursó" si el año ya cerró o el estudiante ya salió (retirado o egresado);
// si no, "cursa".
export function hablaEnPasado({ anioCerrado, estadoEstudiante }) {
  const estado = String(estadoEstudiante ?? "").toLowerCase();
  return Boolean(anioCerrado) || estado === "retirado" || estado === "egresado";
}

// "Se expide la presente certificación a solicitud del interesado en Galapa,
// a los veinte (20) días del mes de enero de 2026."
export function fraseExpedicion({ ciudad, fecha }) {
  const dia = fecha.getDate();
  const diaConCeros = String(dia).padStart(2, "0");
  const cuando = dia === 1
    ? `al primer (${diaConCeros}) día`
    : `a los ${DIAS_EN_LETRAS[dia]} (${diaConCeros}) días`;
  const lugar = String(ciudad ?? "").trim();
  return `Se expide la presente certificación a solicitud del interesado${lugar ? ` en ${lugar}` : ""}, `
    + `${cuando} del mes de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}.`;
}

// Lo que se configura en Diseño de impresos → Identidad institucional
// (`configuracion_extra`). Sin cargo, la firma dice "Director(a)", como antes.
export function datosInstitucionalesCertificado(branding) {
  const extra = branding?.configuracion_extra || {};
  const leer = (clave) => (typeof extra[clave] === "string" ? extra[clave].trim() : "");
  return {
    encabezado: leer("certificado_encabezado"),
    ciudad: leer("ciudad_expedicion"),
    firma: {
      nombre: leer("firmante_nombre"),
      documento: leer("firmante_documento"),
      cargo: leer("firmante_cargo") || "Director(a)",
    },
  };
}

// Datos de un certificado con este formato. El curso y el estado salen de la
// lista del año; el tipo de documento, de la ficha (la lista no lo trae).
export function construirCertificadoFormal({
  tipo,
  estudiante,
  ficha,
  curso,
  anioLectivo,
  anioCerrado,
}) {
  return {
    tipo,
    estudiante_nombre_completo: nombreEstudiante(estudiante),
    tipo_documento: ficha?.tipo_documento || "",
    documento_identidad: ficha?.documento_identidad
      || estudiante?.documento_identidad
      || estudiante?.documento
      || "",
    curso: curso?.nombre || estudiante?.curso_nombre || "",
    nivel: curso?.nivel || null,
    anio_lectivo: String(anioLectivo ?? ""),
    en_pasado: hablaEnPasado({ anioCerrado, estadoEstudiante: estudiante?.estado }),
  };
}

// Lo que impide el paz y salvo. Todo viene calculado del backend: la deuda
// del año a la fecha (solo lo vencido, con su mora), la de años anteriores y
// las ventas fiadas con saldo. Aquí solo se listan y se suman.
export function resumirDeudaPazSalvo({ deudas, ventas }) {
  const items = [];
  for (const deuda of deudas?.deudas || []) {
    const valor = Number(deuda.deuda);
    if (valor > 0) items.push({ etiqueta: deuda.concepto, valor });
  }
  for (const anterior of deudas?.deuda_anios_anteriores || []) {
    const valor = Number(anterior.total_deuda);
    if (valor > 0) items.push({ etiqueta: `Año ${anterior.anio}`, valor });
  }
  for (const venta of ventas || []) {
    const valor = Number(venta.total);
    if (valor > 0) items.push({ etiqueta: venta.descripcion || `Venta #${venta.id}`, valor });
  }
  return {
    items,
    total: items.reduce((suma, item) => suma + item.valor, 0),
  };
}

// Costos educativos: lo que paga el estudiante en el año, ya con su valor
// personalizado, como filas que se editan sobre la hoja antes de imprimir.
// El valor va en dígitos ("280000"), como lo maneja `CampoPesos`.
export function costosDesdeValoresPago(valoresPago) {
  return (valoresPago?.conceptos || []).map((concepto, indice) => ({
    id: `concepto-${concepto.tipo_pago_id ?? indice}`,
    concepto: concepto.nombre || "",
    valor: String(Math.max(0, Math.round(Number(concepto.valor_a_pagar) || 0))),
  }));
}

// Lo que sale en el papel: "Matrícula: $ 280.000". Una fila sin concepto no
// se imprime; una sin valor, solo con el concepto.
export function textoCosto({ concepto, valor }) {
  const nombre = String(concepto ?? "").trim();
  if (!nombre) return "";
  return String(valor ?? "").trim() === "" ? nombre : `${nombre}: ${formatearPesos(valor)}`;
}

const texto = (contenido) => ({ texto: contenido, negrita: false });
const negrita = (contenido) => ({ texto: contenido, negrita: true });

// El párrafo después de «CERTIFICA:», en partes: las de `negrita: true` (el
// nombre, el grado, el desempeño) salen resaltadas, como en los modelos.
export function parrafoCertificado({ tipo, certificado, tratamiento, desempeno }) {
  const { label: sujeto, genero } = obtenerTratamiento(tratamiento);
  const nombre = certificado.estudiante_nombre_completo?.toLocaleUpperCase("es-CO") || RAYA;
  const grado = certificado.curso?.toLocaleUpperCase("es-CO") || RAYA;
  const nivel = textoNivel(certificado.nivel);
  const documento = textoDocumento(certificado.tipo_documento, certificado.documento_identidad);
  const inicio = [
    texto(`Que ${sujeto} `),
    negrita(nombre),
    texto(`, ${concordar("identificad", genero)} con ${documento}, `),
  ];
  const delGrado = [
    texto(" el grado "),
    negrita(grado),
    texto(`${nivel ? ` del nivel de ${nivel}` : ""} del año lectivo ${certificado.anio_lectivo || RAYA}`),
  ];

  if (tipo === "conducta") {
    return [
      ...inicio,
      texto(`${certificado.en_pasado ? "cursó" : "cursa"} en esta institución`),
      ...delGrado,
      texto(", con una conducta descriptiva en "),
      negrita(`DESEMPEÑO ${desempeno || RAYA}`),
      texto("."),
    ];
  }
  if (tipo === "aprobado") {
    return [...inicio, texto("cursó y aprobó en esta institución"), ...delGrado, texto(".")];
  }
  if (tipo === "paz-salvo") {
    return [
      ...inicio,
      texto(`quien ${certificado.en_pasado ? "cursó" : "cursa"}`),
      ...delGrado,
      texto(", se encuentra a paz y salvo con nuestra institución."),
    ];
  }
  // Matrícula y costos educativos (los costos van después, en una lista).
  return [
    ...inicio,
    texto(`${certificado.en_pasado ? "estuvo" : "se encuentra"} ${concordar("matriculad", genero)} en esta institución en`),
    ...delGrado,
    texto("."),
  ];
}
