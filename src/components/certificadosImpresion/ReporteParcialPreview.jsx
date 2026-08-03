import DocumentoImprimible from "../impresion/DocumentoImprimible";
import {
  formatoNota,
  normalizarTexto,
} from "../../utils/certificadosImpresion/certificados";
import DatoCertificado from "./DatoCertificado";

export default function ReporteParcialPreview({ reporte, onBack }) {
  const esCurso = reporte.alcance === "curso";
  const promedios = reporte.estudiantes
    .map((estudiante) => estudiante.promedio)
    .filter((promedio) => promedio !== null);
  const promedioGeneral = promedios.length
    ? promedios.reduce((total, promedio) => total + promedio, 0) / promedios.length
    : null;
  const totalAusencias = reporte.estudiantes.reduce(
    (total, estudiante) => total + estudiante.inasistencias,
    0,
  );
  const titulo = "Reporte Académico Parcial";
  const subtitulo = `Periodo ${reporte.periodo} · ${reporte.materia}`;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="fixed left-4 top-4 z-50 no-print md:left-6 md:top-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800"
          title="Atras"
        >
          ← Atrás
        </button>
      </div>

      <DocumentoImprimible
        tipo="reporte_estudiante"
        className="di-documento--certificado"
        titulo={titulo}
        subtitulo={subtitulo}
        firmas={[
          { nombre: "", cargo: "Coordinacion academica" },
          { nombre: "", cargo: "Direccion" },
        ]}
      >
        <section className="space-y-5 text-slate-800">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-900">
            Informe parcial e informativo generado con las notas registradas hasta la fecha.
            No reemplaza boletin final, certificado oficial ni cierre academico del periodo.
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DatoCertificado label="Curso" value={normalizarTexto(reporte.curso)} />
              <DatoCertificado label="Periodo" value={`Periodo ${reporte.periodo}`} />
              <DatoCertificado label="Materia" value={normalizarTexto(reporte.materia)} />
              <DatoCertificado label={esCurso ? "Estudiantes" : "Inasistencias"} value={esCurso ? reporte.estudiantes.length : totalAusencias} />
              {esCurso && (
                <>
                  <DatoCertificado label="Promedio grupo" value={formatoNota(promedioGeneral)} />
                  <DatoCertificado label="Inasistencias" value={totalAusencias} />
                  <DatoCertificado label="Fecha" value={reporte.fecha} />
                  <DatoCertificado label="Alcance" value="Curso" />
                </>
              )}
            </div>
          </div>

          {reporte.errores > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500">
              {reporte.errores} registro(s) no pudieron cargarse y fueron omitidos del reporte.
            </div>
          )}

          {esCurso ? (
            <ReporteParcialCurso estudiantes={reporte.estudiantes} />
          ) : (
            <ReporteParcialEstudiante estudiante={reporte.estudiantes[0]} />
          )}
        </section>
      </DocumentoImprimible>
    </div>
  );
}

function ReporteParcialCurso({ estudiantes }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Estudiante</th>
            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Materia</th>
            <th className="px-2 py-2 text-left font-semibold uppercase tracking-wide">Docente</th>
            <th className="w-20 px-2 py-2 text-center font-semibold uppercase tracking-wide">Nota</th>
            <th className="w-20 px-2 py-2 text-center font-semibold uppercase tracking-wide">Inas.</th>
            <th className="w-28 px-2 py-2 text-center font-semibold uppercase tracking-wide">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {estudiantes.flatMap((estudiante) => {
            if (!estudiante.materias.length) {
              return [
                <tr key={`${estudiante.id}-sin-materias`}>
                  <td className="px-2 py-2 align-top">
                    <p className="font-bold uppercase text-slate-900">{estudiante.nombre}</p>
                    <p className="text-[10px] text-slate-500">{estudiante.documento}</p>
                  </td>
                  <td colSpan="5" className="px-2 py-2 text-center font-semibold text-slate-400">
                    Sin registros academicos para la seleccion actual.
                  </td>
                </tr>,
              ];
            }

            return estudiante.materias.map((materia, index) => (
              <tr key={`${estudiante.id}-${materia.asignacion_id}-${index}`} className="page-break-inside-avoid">
                <td className="px-2 py-2 align-top">
                  {index === 0 && (
                    <>
                      <p className="font-bold uppercase text-slate-900">{estudiante.nombre}</p>
                      <p className="text-[10px] text-slate-500">{estudiante.documento}</p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-600">
                        Promedio: {formatoNota(estudiante.promedio)} · Inasistencias: {estudiante.inasistencias}
                      </p>
                    </>
                  )}
                </td>
                <td className="px-2 py-2 font-semibold uppercase text-slate-800">{materia.nombre}</td>
                <td className="px-2 py-2 text-slate-600">{materia.docente}</td>
                <td className="px-2 py-2 text-center text-sm font-black text-slate-900">{formatoNota(materia.definitiva)}</td>
                <td className="px-2 py-2 text-center font-bold text-slate-700">{materia.inasistencias}</td>
                <td className="px-2 py-2 text-center font-semibold text-slate-700">{materia.estado}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReporteParcialEstudiante({ estudiante }) {
  if (!estudiante) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-semibold text-slate-400">
        No hay datos para mostrar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DatoCertificado label="Estudiante" value={estudiante.nombre} />
          <DatoCertificado label="Documento" value={estudiante.documento} />
          <DatoCertificado label="Promedio" value={formatoNota(estudiante.promedio)} />
          <DatoCertificado label="Inasistencias" value={estudiante.inasistencias} />
        </div>
      </div>

      {estudiante.materias.map((materia) => (
        <article key={`${estudiante.id}-${materia.asignacion_id}`} className="page-break-inside-avoid overflow-hidden rounded-lg border border-slate-200">
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">{materia.nombre}</h3>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Docente: {materia.docente}</p>
            </div>
            <div className="grid min-w-[150px] grid-cols-2 gap-1 text-center text-[10px]">
              <span className="rounded border border-slate-200 bg-white px-2 py-1 font-bold text-slate-600">
                Nota {formatoNota(materia.definitiva)}
              </span>
              <span className="rounded border border-slate-200 bg-white px-2 py-1 font-bold text-slate-600">
                Inas. {materia.inasistencias}
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_140px]">
            <div className="overflow-hidden">
              {materia.detalles.length ? (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-white text-[10px] uppercase tracking-wide text-slate-500">
                      <th className="border-b border-slate-200 px-3 py-1.5 text-left">Evaluacion / observacion</th>
                      <th className="w-24 border-b border-slate-200 px-3 py-1.5 text-center">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materia.detalles.map((detalle, index) => (
                      <tr key={`${materia.asignacion_id}-detalle-${index}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-1.5 text-slate-700">{detalle.descripcion}</td>
                        <td className="px-3 py-1.5 text-center font-bold text-slate-900">{detalle.valor || "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-3 py-4 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Calificacion y observaciones pendientes por ingresar.
                </div>
              )}
            </div>
            <aside className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs md:border-l md:border-t-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Estado</p>
              <p className="mt-1 font-black text-slate-800">{materia.estado}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Desempeno</p>
              <p className="mt-1 font-black text-slate-800">{materia.desempeno}</p>
            </aside>
          </div>
        </article>
      ))}

      {estudiante.materias.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm font-semibold text-slate-400">
          Sin registros academicos para la seleccion actual.
        </div>
      )}
    </div>
  );
}
