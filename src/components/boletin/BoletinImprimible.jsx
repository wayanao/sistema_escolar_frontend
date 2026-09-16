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
import DocumentoImprimible from "../impresion/DocumentoImprimible";

export default function BoletinImprimible({ boletinData, onVolver }) {
  const usaDesarrolloInfantil = detectarDesarrolloInfantil(
    boletinData.materias,
  );
  const materias = consolidarMateriasBoletin(boletinData.materias);

  return (
    <div className="bg-gray-100 min-h-screen py-10 px-4 md:px-8 relative">
      <div className="fixed left-4 top-4 no-print z-50 md:left-6 md:top-6">
        <button
          onClick={onVolver}
          className="bg-slate-800 text-white px-4 py-2.5 rounded-full text-sm font-bold shadow-xl hover:bg-slate-900 transition"
          title="Atras"
        >
          ← Atrás
        </button>
      </div>

      <DocumentoImprimible
        tipo="boletin"
        className="di-documento--boletin"
        titulo="Boletín Académico Informativo"
        subtitulo={`Periodo ${boletinData.periodo} · Año Lectivo ${new Date().getFullYear()}`}
        firmas={[
          { nombre: "Director del Colegio" },
          { nombre: "Director de Grupo" },
        ]}
      >
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 mb-4 flex flex-wrap items-start gap-x-6 gap-y-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 leading-none mb-1">
              Estudiante
            </p>
            <p className="text-base font-extrabold uppercase tracking-wide text-slate-800 leading-tight break-words">
              {boletinData.estudiante_apellido}, {boletinData.estudiante_nombre}
            </p>
          </div>
          <div className="flex items-stretch gap-1.5 text-[11px]">
            <Chip label="Grado" value={boletinData.curso} highlight />
            <Chip label="Periodo" value={boletinData.periodo} highlight />
            <Chip label="Fecha" value={new Date().toLocaleDateString("es-CO")} />
          </div>
        </div>

        <EscalaYPromedio
          boletinData={boletinData}
          usaDesarrolloInfantil={usaDesarrolloInfantil}
        />

        <h2 className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-700 border-b-2 border-slate-800 pb-1 mb-3">
          Resumen de evaluaciones
        </h2>

        <div className="space-y-3">
          {materias.map((materia) => (
            <MateriaBoletin key={`${materia.materia_id}-${materia.boletin_id}`} materia={materia} />
          ))}

          {boletinData.materias.length === 0 && (
            <div className="p-8 text-center font-semibold text-slate-400 border-2 border-dashed border-slate-300 rounded">
              El curso no tiene asignadas materias o profesores todavía.
            </div>
          )}
        </div>

        <section className="mt-5 page-break-inside-avoid">
          <p
            className="text-[10px] uppercase tracking-widest font-bold mb-1.5"
            style={{ color: "var(--di-color-primario, #0f314f)" }}
          >
            Observación general
          </p>
          <div
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-placeholder="Escriba aquí la observación general del estudiante…"
            className="di-observacion-editable rounded-lg border border-slate-300 bg-white text-slate-800"
            style={{
              minHeight: "110px",
              padding: "10px 14px",
              lineHeight: "24px",
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 23px, #e2e8f0 23px, #e2e8f0 24px)",
              backgroundPosition: "0 14px",
              outline: "none",
              whiteSpace: "pre-wrap",
            }}
          />
        </section>
      </DocumentoImprimible>
    </div>
  );
}

function EscalaYPromedio({ boletinData, usaDesarrolloInfantil }) {
  const promedio = calcularPromedioGeneral(boletinData.materias);
  const valoracionPromedio = usaDesarrolloInfantil
    ? valoracionDesdePromedio(Number(promedio) || null)
    : null;

  return (
    <div className="rounded-lg border border-slate-200 mb-4 overflow-hidden">
      <div className="flex items-stretch">
        <div className="flex-1 p-3">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
            Escala de valoración
          </p>
          <div className="flex flex-wrap gap-1.5">
            {usaDesarrolloInfantil
              ? Object.entries(VALORACIONES_DESARROLLO).map(([key, item]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-2 py-0.5 text-[11px] font-semibold"
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </span>
                ))
              : ESCALA_NUMERICA.map((item) => (
                  <span
                    key={item.rango}
                    className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-900 border border-purple-200 rounded px-2 py-0.5 text-[11px]"
                  >
                    <span className="font-black">{item.rango}</span>
                    <span className="font-semibold">{item.concepto}</span>
                  </span>
                ))}
          </div>
        </div>
        <div
          className="border-l border-slate-200 px-5 py-3 flex items-stretch text-white min-w-[140px] divide-x divide-white/20"
          style={{ backgroundColor: "var(--di-color-primario, #0f314f)" }}
        >
          <div className="flex flex-col items-center justify-center px-2">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">
              Promedio
            </span>
            {/* En desarrollo el promedio existe como número para poder rankear,
                pero el boletín nunca lo muestra: se traduce a su carita. */}
            {usaDesarrolloInfantil ? (
              <span
                className="text-3xl leading-none mt-1"
                title={valoracionPromedio?.label || "Sin calificar"}
              >
                {valoracionPromedio?.emoji || "—"}
              </span>
            ) : (
              <span
                className={`text-3xl font-black leading-none mt-1 ${
                  promedio >= 3.0 || promedio == 0 ? "text-white" : "text-red-300"
                }`}
              >
                {promedio}
              </span>
            )}
            <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70 mt-1">
              {usaDesarrolloInfantil
                ? valoracionPromedio?.label || "general"
                : "general"}
            </span>
          </div>
          {boletinData.puesto &&
            boletinData.total_estudiantes > 0 && (
              <div className="flex flex-col items-center justify-center px-3">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">
                  Puesto
                </span>
                <span className="text-3xl font-black leading-none mt-1">
                  {boletinData.puesto}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70 mt-1">
                  de {boletinData.total_estudiantes}
                </span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function MateriaBoletin({ materia }) {
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
    <div className="border border-slate-200 rounded-lg overflow-hidden page-break-inside-avoid">
      <div className="px-3 py-2 flex justify-between items-center bg-slate-50 border-b border-slate-200">
        <div className="min-w-0">
          <h3 className="font-bold uppercase text-slate-800 tracking-wide text-sm truncate">
            {materia.materia}
          </h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
            Docente: {materia.profesor_nombre} {materia.profesor_apellido || ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tipoMateria === "desarrollo" ? (
            <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-800">
              <span className="text-xl leading-none">
                {valoracionMateria?.emoji || "—"}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {valoracionMateria?.label || "Sin calificar"}
              </span>
            </span>
          ) : (
            <>
              <span
                className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded border ${styles.text} ${styles.bg}`}
              >
                {desempeno}
              </span>
              <span className={`text-2xl font-black leading-none ${styles.text}`}>
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
              <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase tracking-wide">
                <th className="text-left px-3 py-1.5 border-b border-slate-200">
                  Logro / Observación
                </th>
                <th className="text-center px-2 py-1.5 w-12 border-b border-slate-200">
                  P1
                </th>
                <th className="text-center px-2 py-1.5 w-12 border-b border-slate-200">
                  P2
                </th>
                <th className="text-center px-2 py-1.5 w-12 border-b border-slate-200">
                  P3
                </th>
                <th className="text-center px-2 py-1.5 w-12 border-b border-slate-200">
                  P4
                </th>
              </tr>
            </thead>
            <tbody>
              {materia.detalles.map((detalle, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-3 py-1.5 text-slate-700 break-words whitespace-normal max-w-[300px]">
                    {detalle.observacion?.trim() || (
                      <span className="text-slate-400 italic">
                        Sin observación
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center font-semibold text-slate-700">
                    {formatearValoracionPeriodo(detalle, "1")}
                  </td>
                  <td className="px-2 py-1.5 text-center font-semibold text-slate-700">
                    {formatearValoracionPeriodo(detalle, "2")}
                  </td>
                  <td className="px-2 py-1.5 text-center font-semibold text-slate-700">
                    {formatearValoracionPeriodo(detalle, "3")}
                  </td>
                  <td className="px-2 py-1.5 text-center font-semibold text-slate-700">
                    {formatearValoracionPeriodo(detalle, "4")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-3 text-slate-400 text-[10px] uppercase font-semibold">
            Calificación y observaciones pendientes por ingresar.
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ label, value, highlight }) {
  const highlightStyle = highlight
    ? {
        backgroundColor: "var(--di-color-primario, #0f314f)",
        borderColor: "var(--di-color-primario, #0f314f)",
        color: "#ffffff",
      }
    : undefined;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 border ${
        highlight ? "" : "bg-white text-slate-700 border-slate-300"
      }`}
      style={highlightStyle}
    >
      <span
        className={`text-[9px] uppercase tracking-widest font-bold ${
          highlight ? "opacity-75" : "text-slate-500"
        }`}
      >
        {label}
      </span>
      <span className="font-bold">{value}</span>
    </span>
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
