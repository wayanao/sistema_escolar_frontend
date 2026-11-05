import {
  ESTADOS,
  MATERIA_TODAS,
  PERIODOS,
  PERIODOS_REPORTE,
  documentoEstudiante,
  nombreEstudiante,
} from "../../utils/certificadosImpresion/certificados";

const TABS = [
  { id: "notas", label: "Certificado de notas" },
  { id: "matricula", label: "Certificado de matrícula" },
  { id: "reporte-parcial", label: "Reporte académico parcial" },
];

export default function SeleccionCertificados({
  anioLectivo,
  busqueda,
  cursoSeleccionado,
  cursos,
  cursosPorId,
  error,
  estadoFiltro,
  estudiantes,
  generandoCurso,
  generandoId,
  loading,
  materiaReporte,
  materias,
  periodo,
  periodoReporte,
  tabActiva,
  onCambiarAnioLectivo,
  onCambiarBusqueda,
  onCambiarCurso,
  onCambiarEstado,
  onCambiarMateriaReporte,
  onCambiarPeriodo,
  onCambiarPeriodoReporte,
  onCambiarTab,
  onGenerarCurso,
  onGenerarEstudiante,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Certificados</h1>
        <p className="text-sm text-slate-600">
          Genera certificados e informes academicos para consulta administrativa e impresion.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onCambiarTab(tab.id)}
            className={`border-b-2 px-4 py-2 text-sm font-bold transition ${
              tabActiva === tab.id
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_150px]">
          <select
            value={cursoSeleccionado}
            onChange={(event) => onCambiarCurso(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          >
            <option value="">Todos los cursos</option>
            {cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre} {curso.jornada ? `- ${curso.jornada}` : ""}
              </option>
            ))}
          </select>

          <input
            type="search"
            value={busqueda}
            onChange={(event) => onCambiarBusqueda(event.target.value)}
            placeholder={tabActiva === "reporte-parcial" ? "Buscar alumno para reporte individual" : "Buscar por estudiante o documento"}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />

          {tabActiva === "notas" ? (
            <select
              value={periodo}
              onChange={(event) => onCambiarPeriodo(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              {PERIODOS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          ) : tabActiva === "matricula" ? (
            <input
              type="number"
              min="2000"
              max="2100"
              value={anioLectivo}
              onChange={(event) => onCambiarAnioLectivo(event.target.value)}
              placeholder="Año lectivo"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          ) : (
            <select
              value={periodoReporte}
              onChange={(event) => onCambiarPeriodoReporte(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              {PERIODOS_REPORTE.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          )}

          <select
            value={estadoFiltro}
            onChange={(event) => onCambiarEstado(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          >
            {ESTADOS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          {tabActiva === "reporte-parcial" && (
            <>
              <select
                value={materiaReporte}
                onChange={(event) => onCambiarMateriaReporte(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 md:col-span-1 xl:col-span-2"
              >
                <option value={MATERIA_TODAS}>Todas las materias</option>
                {materias.map((materia) => (
                  <option key={materia.id} value={materia.id}>
                    {materia.nombre}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!cursoSeleccionado || generandoCurso || !!generandoId}
                onClick={onGenerarCurso}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-1 xl:col-span-2"
              >
                {generandoCurso ? "Generando reporte..." : "Generar reporte del curso"}
              </button>
            </>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Documento</th>
                  <th className="px-4 py-3 font-semibold">Estudiante</th>
                  <th className="px-4 py-3 font-semibold">Curso</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Accion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estudiantes.map((estudiante) => {
                  const curso = cursosPorId.get(estudiante.curso_id);
                  const cargando = generandoId === estudiante.id;
                  return (
                    <tr key={estudiante.id} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3 text-slate-600">
                        {documentoEstudiante(estudiante)}
                      </td>
                      <td className="px-4 py-3 font-semibold uppercase text-slate-900">
                        {nombreEstudiante(estudiante)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {curso?.nombre || "Sin asignar"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                          {estudiante.estado || "activo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={!!generandoId || generandoCurso}
                          onClick={() => onGenerarEstudiante(estudiante.id)}
                          className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cargando
                            ? "Generando..."
                            : tabActiva === "matricula"
                              ? "Generar matrícula"
                              : tabActiva === "reporte-parcial"
                                ? "Ver reporte"
                                : "Generar notas"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {estudiantes.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-sm text-slate-500">
                      No hay estudiantes para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
