import {
  calcularPromedioGeneral,
  consolidarMateriasBoletin,
  ESCALA_NUMERICA,
  formatearValoracionPeriodo,
  obtenerDesempeno,
  usaDesarrolloInfantil as detectarDesarrolloInfantil,
  valoracionDesdePromedio,
  VALORACIONES_DESARROLLO,
} from "../../utils/boletines/generacionBoletin";
import { avisosDeFirmas, firmasDelBoletin } from "../../utils/boletines/firmasBoletin";
import DocumentoImprimible from "../impresion/DocumentoImprimible";
import BarraCertificado from "../certificadosImpresion/BarraCertificado";

// Fondos grises derivados del color secundario de la identidad institucional,
// en vez de un gris fijo: así se ven coherentes con el resto del boletín sin
// agregar un selector de color aparte.
const FONDO_SUAVE = {
  backgroundColor: "color-mix(in srgb, var(--di-color-secundario, #526775) 8%, white)",
  borderColor: "color-mix(in srgb, var(--di-color-secundario, #526775) 20%, white)",
};
const FONDO_TABLA = {
  backgroundColor: "color-mix(in srgb, var(--di-color-secundario, #526775) 12%, white)",
};
// Promedio y puesto: color primario macizo con letra blanca, en tamaño compacto.
const FONDO_INDICADOR = {
  backgroundColor: "var(--di-color-primario, #0f314f)",
  color: "#ffffff",
};

export default function BoletinImprimible({ boletinData, onVolver }) {
  const usaDesarrolloInfantil = detectarDesarrolloInfantil(
    boletinData.materias,
  );
  const materias = consolidarMateriasBoletin(boletinData.materias);
  // El periodo no va aquí: ya sale bajo el título del boletín.
  const datos = [
    boletinData.director_grupo && ["Director de grupo", boletinData.director_grupo],
    ["Grado", boletinData.curso],
    boletinData.jornada && ["Jornada", boletinData.jornada],
    ["Fecha", new Date().toLocaleDateString("es-CO")],
  ].filter(Boolean);
  const avisos = avisosDeFirmas(boletinData);

  return (
    <div className="bg-gray-100 min-h-screen py-10 px-4 md:px-8 relative">
      {/* "Atrás" va arriba de la hoja, como en los certificados: fijo en la
          esquina de la pantalla quedaba encima del menú lateral (2026-11-07). */}
      <BarraCertificado onBack={onVolver} />

      {/* Qué firma falta (FIRMAS_BOLETIN.md, paso 4): solo en pantalla. */}
      {avisos.length > 0 && (
        <div
          role="status"
          className="no-print mx-auto mt-3 w-full max-w-[215.9mm] space-y-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {avisos.map((aviso) => (
            <p key={aviso}>{aviso}</p>
          ))}
        </div>
      )}

      <DocumentoImprimible
        tipo="boletin"
        className="di-documento--boletin"
        titulo="Boletín Académico Informativo"
        subtitulo={`Periodo ${boletinData.periodo} · Año Lectivo ${new Date().getFullYear()}`}
        firmas={(branding) => firmasDelBoletin(boletinData, branding)}
      >
        <FichaEstudianteBoletin
          nombre={<>{boletinData.estudiante_apellido} {boletinData.estudiante_nombre}</>}
          datos={datos}
        >
          <Indicadores
            boletinData={boletinData}
            usaDesarrolloInfantil={usaDesarrolloInfantil}
          />
        </FichaEstudianteBoletin>

        <Escala usaDesarrolloInfantil={usaDesarrolloInfantil} />

        <div className="space-y-2">
          {materias.map((materia) => (
            <MateriaBoletin key={`${materia.materia_id}-${materia.boletin_id}`} materia={materia} />
          ))}

          {boletinData.materias.length === 0 && (
            <div className="p-8 text-center font-semibold text-slate-400 border-2 border-dashed border-slate-300 rounded">
              El curso no tiene asignadas materias o profesores todavía.
            </div>
          )}
        </div>

        {/* mt-8: aire entre la última materia y la observación general */}
        <section className="mt-8 break-inside-avoid">
          <p
            className="text-[10px] uppercase tracking-widest font-bold mb-1"
            style={{ color: "var(--di-color-texto-principal, #0f314f)" }}
          >
            Observación general
          </p>
          {/* Sale con la que guardó el director de grupo en Boletín Final
              («Mi curso», paso 4). Se puede retocar aquí solo para esta
              impresión: no se guarda (decidido con el usuario el 2026-11-07).
              La `key` la vuelve a llenar al cambiar de estudiante o periodo. */}
          <div
            key={`${boletinData.estudiante_id ?? ""}-${boletinData.periodo ?? ""}`}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-placeholder="Escriba aquí la observación general del estudiante…"
            className="di-observacion-editable rounded-lg border border-slate-300 bg-white text-slate-800"
            style={{
              // Espacio para tres renglones, en blanco (sin rayas guía).
              minHeight: "82px",
              padding: "6px 14px",
              lineHeight: "24px",
              outline: "none",
              whiteSpace: "pre-wrap",
            }}
          >
            {boletinData.observacion_general || ""}
          </div>
          <p className="no-print mt-1 text-[11px] text-slate-500">
            La observación guardada la escribe el director de grupo en Boletín Final. Si la
            cambias aquí, el cambio sale solo en esta impresión y no se guarda.
          </p>
        </section>
      </DocumentoImprimible>
    </div>
  );
}

/**
 * Ficha: estudiante y sus datos a la izquierda y, como `children`, lo que va a
 * la derecha (promedio y puesto), en un solo recuadro. La comparte la vista
 * previa del profesor, que no tiene promedio ni puesto.
 */
export function FichaEstudianteBoletin({ nombre, datos, children }) {
  return (
    <div className="rounded-lg border mb-2 flex items-stretch overflow-hidden" style={FONDO_SUAVE}>
      <div className="flex-1 min-w-0 px-3 py-2">
        <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500 leading-none">
          Estudiante
        </p>
        <p className="text-[15px] font-bold uppercase tracking-wide text-slate-800 leading-tight mt-1 break-words">
          {nombre}
        </p>
        {/* Una columna por dato: si no caben, no queda una raya suelta al
            comienzo de un renglón. */}
        <div
          className="mt-1.5 grid gap-y-1"
          style={{ gridTemplateColumns: `repeat(${datos.length}, auto)`, justifyContent: "start" }}
        >
          {datos.map(([label, value]) => (
            <Dato key={label} label={label} value={value} />
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

function Indicadores({ boletinData, usaDesarrolloInfantil }) {
  const promedio = calcularPromedioGeneral(boletinData.materias);
  const valoracionPromedio = usaDesarrolloInfantil
    ? valoracionDesdePromedio(Number(promedio) || null)
    : null;
  const hayPuesto = boletinData.puesto && boletinData.total_estudiantes > 0;

  return (
    <div className="flex shrink-0" style={FONDO_INDICADOR}>
      <Indicador
        titulo="Promedio"
        detalle={usaDesarrolloInfantil ? valoracionPromedio?.label || "general" : "general"}
      >
        {/* En desarrollo el promedio existe como número para poder rankear,
            pero el boletín nunca lo muestra: se traduce a su carita. */}
        {usaDesarrolloInfantil ? (
          <span title={valoracionPromedio?.label || "Sin calificar"}>
            {valoracionPromedio?.emoji || "—"}
          </span>
        ) : (
          <span className={promedio >= 3.0 || promedio == 0 ? "" : "text-red-300"}>
            {promedio}
          </span>
        )}
      </Indicador>
      {hayPuesto && (
        <Indicador
          titulo="Puesto"
          detalle={`de ${boletinData.total_estudiantes}`}
          conSeparador
        >
          {boletinData.puesto}
        </Indicador>
      )}
    </div>
  );
}

function Indicador({ titulo, detalle, conSeparador = false, children }) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 min-w-[76px] ${conSeparador ? "border-l border-white/20" : ""}`}
    >
      <span className="text-[8.5px] uppercase tracking-widest font-bold opacity-80">
        {titulo}
      </span>
      <span className="text-2xl font-black leading-none my-0.5">{children}</span>
      <span className="text-[8.5px] uppercase tracking-widest font-semibold opacity-80">
        {detalle}
      </span>
    </div>
  );
}

// La escala va en un solo renglón, como leyenda, cerrada por una línea del
// color primario igual a la del membrete. Entre la escala y la primera materia
// quedan los mismos 40 px que ocupaba el título "Resumen de evaluaciones"
// (pb-2 + línea + mb-8), para que las materias no queden pegadas.
export function Escala({ usaDesarrolloInfantil }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-2 mb-8 px-1 border-b text-[10.5px] text-slate-700"
      style={{ borderColor: "var(--di-color-primario, #0f314f)" }}
    >
      <span className="text-[8.5px] uppercase tracking-widest font-bold text-slate-500">
        Escala de valoración
      </span>
      {usaDesarrolloInfantil
        ? Object.entries(VALORACIONES_DESARROLLO).map(([key, item]) => (
            <span key={key} className="inline-flex items-center gap-1 font-semibold">
              <span className="text-sm leading-none">{item.emoji}</span>
              <span>{item.label}</span>
            </span>
          ))
        : ESCALA_NUMERICA.map((item) => (
            <span key={item.rango} className="inline-flex items-center gap-1">
              <span
                className="font-black"
                style={{ color: "var(--di-color-primario, #0f314f)" }}
              >
                {item.rango}
              </span>
              <span className="font-semibold">{item.concepto}</span>
            </span>
          ))}
    </div>
  );
}

export function MateriaBoletin({ materia }) {
  const tipoMateria = materia.detalles?.some(
    (detalle) => detalle.tipo_evaluacion === "desarrollo",
  )
    ? "desarrollo"
    : "numerica";
  const styles = obtenerEstilos(materia.definitiva);
  const desempeno = obtenerDesempeno(materia.definitiva);
  // La definitiva de una materia de desarrollo llega como número, porque es lo
  // que el puesto del curso necesita promediar. Aquí vuelve a ser carita.
  const valoracionMateria =
    tipoMateria === "desarrollo"
      ? valoracionDesdePromedio(materia.definitiva)
      : null;

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden break-inside-avoid">
      {/* Nombre de la materia y docente en un solo renglón */}
      <div className="px-3 py-1 flex justify-between items-center gap-3 border-b" style={FONDO_SUAVE}>
        <div className="min-w-0 truncate leading-tight">
          <h3 className="inline font-bold uppercase text-slate-800 tracking-wide text-[13px]">
            {materia.materia}
          </h3>
          <span className="text-[10px] text-slate-500 ml-2">
            Docente: {materia.profesor_nombre} {materia.profesor_apellido || ""}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tipoMateria === "desarrollo" ? (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-800">
              <span className="text-base leading-none">
                {valoracionMateria?.emoji || "—"}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest">
                {valoracionMateria?.label || "Sin calificar"}
              </span>
            </span>
          ) : (
            <>
              <span
                className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded border ${styles.text} ${styles.bg}`}
              >
                {desempeno}
              </span>
              <span className={`text-lg font-black leading-none ${styles.text}`}>
                {materia.definitiva !== null
                  ? materia.definitiva.toFixed(1)
                  : "---"}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="bg-white">
        {materia.detalles && materia.detalles.length > 0 ? (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="text-slate-600 text-[9px] uppercase tracking-wide" style={FONDO_TABLA}>
                <th className="text-left px-3 py-0.5 border-b border-slate-200">
                  Logro / Observación
                </th>
                <th className="text-center px-1 py-0.5 w-10 border-b border-slate-200">
                  P1
                </th>
                <th className="text-center px-1 py-0.5 w-10 border-b border-slate-200">
                  P2
                </th>
                <th className="text-center px-1 py-0.5 w-10 border-b border-slate-200">
                  P3
                </th>
                <th className="text-center px-1 py-0.5 w-10 border-b border-slate-200">
                  P4
                </th>
              </tr>
            </thead>
            <tbody>
              {materia.detalles.map((detalle, index) => {
                // Las caritas de preescolar van más grandes que las notas; con
                // leading-none no agrandan la fila (la manda el texto del logro).
                const celdaPeriodo = `px-1 py-1 text-center font-semibold text-slate-700${
                  detalle.tipo_evaluacion === "desarrollo" ? " text-base leading-none" : ""
                }`;
                return (
                  <tr
                    key={index}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-3 py-1 text-slate-700 break-words whitespace-normal max-w-[300px]">
                      {/* Viñeta del color primario; si el logro ocupa dos
                          renglones, el segundo queda alineado con el texto. */}
                      <div className="flex items-start gap-1.5">
                        <span
                          aria-hidden="true"
                          className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full"
                          style={{ backgroundColor: "var(--di-color-primario, #0f314f)" }}
                        />
                        <span className="min-w-0">
                          {detalle.observacion?.trim() || (
                            <span className="text-slate-400 italic">
                              Sin observación
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className={celdaPeriodo}>
                      {formatearValoracionPeriodo(detalle, "1")}
                    </td>
                    <td className={celdaPeriodo}>
                      {formatearValoracionPeriodo(detalle, "2")}
                    </td>
                    <td className={celdaPeriodo}>
                      {formatearValoracionPeriodo(detalle, "3")}
                    </td>
                    <td className={celdaPeriodo}>
                      {formatearValoracionPeriodo(detalle, "4")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-2 text-slate-400 text-[10px] uppercase font-semibold">
            Calificación y observaciones pendientes por ingresar.
          </div>
        )}
      </div>
    </div>
  );
}

// Etiqueta arriba y valor abajo; la raya de color entre datos la pone
// `.bi-dato + .bi-dato` en print.css.
function Dato({ label, value }) {
  return (
    <div className="bi-dato px-3 first:pl-0 last:pr-0">
      <p className="text-[8.5px] uppercase tracking-widest font-bold text-slate-500 leading-tight">
        {label}
      </p>
      <p className="text-[11px] font-bold text-slate-800 leading-tight">{value}</p>
    </div>
  );
}

function obtenerEstilos(definitiva) {
  if (definitiva === null) {
    return { text: "text-gray-500", bg: "bg-gray-100" };
  }
  if (definitiva >= 4.0) {
    return { text: "text-green-700", bg: "bg-green-50" };
  }
  if (definitiva >= 3.0) {
    return { text: "text-purple-700", bg: "bg-purple-50" };
  }
  return { text: "text-red-700", bg: "bg-red-50" };
}
