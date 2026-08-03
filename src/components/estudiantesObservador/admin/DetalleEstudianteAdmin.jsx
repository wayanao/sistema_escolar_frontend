export default function DetalleEstudianteAdmin({
  estudiante,
  cursos,
  detalles,
  cargando,
  onCerrar,
}) {
  if (!estudiante) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-3 sm:my-8 relative flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-start justify-between gap-3 bg-gray-50 rounded-t-lg">
          <h2 className="min-w-0 text-lg sm:text-2xl font-bold text-gray-800 flex flex-col gap-2 capitalize sm:flex-row sm:items-center">
            <span className="break-words">
              Resumen de {estudiante.apellido} {estudiante.nombre}
            </span>
            <span className="w-fit text-xs sm:text-sm bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1 rounded-full font-medium">
              {cursos.find((curso) => curso.id === estudiante.curso_id)?.nombre ||
                "Curso no asignado"}
            </span>
          </h2>
          <button
            onClick={onCerrar}
            className="text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto flex-1">
          {cargando ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
          ) : detalles ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  👨‍🏫 Rendimiento
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Promedio General:</strong>{" "}
                  <span
                    className={`font-bold ${detalles.promedio_general >= 3.0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {detalles.promedio_general !== undefined
                      ? detalles.promedio_general
                      : "N/A"}
                  </span>
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Inasistencias Acumuladas:</strong>{" "}
                  {detalles.inasistencias}
                </p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Promedio de Notas por Materia:
                  </p>
                  {detalles.notas && detalles.notas.length > 0 ? (
                    <ul className="space-y-1">
                      {detalles.notas.map((nota, indice) => (
                        <li
                          key={indice}
                          className="text-sm flex justify-between bg-white px-2 py-1 rounded shadow-sm"
                        >
                          <span>{nota.materia}</span>
                          <span
                            className={`font-semibold ${nota.promedio >= 3.0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {nota.promedio}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      No hay notas registradas
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col">
                <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                  💰 Estado Financiero
                </h3>
                <div className="mb-4">
                  <h4 className="font-medium text-red-800 border-b border-red-200 pb-1 mb-2">
                    Pensiones y Colegiatura
                  </h4>
                  {detalles.deudas && detalles.deudas.length > 0 ? (
                    <>
                      <ul className="space-y-2 mb-2 max-h-40 overflow-y-auto pr-1">
                        {detalles.deudas.map((deuda, indice) => (
                          <li
                            key={indice}
                            className="text-sm bg-white p-2 rounded shadow-sm border-l-4 border-red-500"
                          >
                            <div className="flex justify-between font-semibold text-gray-800">
                              <span>{deuda.concepto}</span>
                              <span className="text-red-600">
                                ${deuda.deuda.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Valor base: ${deuda.valor_total.toLocaleString()} |
                              Pagado: ${deuda.pagado.toLocaleString()}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-2 border-t border-red-200 flex justify-between items-center">
                        <span className="font-bold text-gray-700">
                          Deuda Total:
                        </span>
                        <span className="font-bold text-red-700 text-lg">
                          ${detalles.total_deuda?.toLocaleString() || 0}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-green-700 bg-green-100 p-2 rounded-lg">
                      <span>✅</span>{" "}
                      <p className="text-sm font-semibold">
                        Sin deudas pendientes.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="font-medium text-red-800 border-b border-red-200 pb-1 mb-2">
                    Reporte de Productos del Inventario
                  </h4>
                  {detalles.productos_inventario &&
                  detalles.productos_inventario.length > 0 ? (
                    <ul className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {detalles.productos_inventario.map((producto, indice) => (
                        <li
                          key={indice}
                          className={`text-sm bg-white p-2 rounded shadow-sm border-l-4 ${producto.estado.includes("Pendiente") ? "border-red-500" : "border-green-500"}`}
                        >
                          <div className="flex justify-between font-semibold text-gray-800">
                            <span>
                              {producto.cantidad}x {producto.producto}
                            </span>
                            <span
                              className={
                                producto.estado.includes("Pendiente")
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              $
                              {producto.estado.includes("Pendiente") &&
                              producto.saldo
                                ? producto.saldo.toLocaleString()
                                : producto.subtotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 flex justify-between mt-1">
                            <span>
                              Fecha: {producto.fecha}{" "}
                              {producto.estado === "Pendiente (Abonado)"
                                ? `(Valor ref: $${producto.subtotal.toLocaleString()})`
                                : ""}
                            </span>
                            <span
                              className={`font-bold ${producto.estado.includes("Pendiente") ? "text-red-500" : "text-green-500"}`}
                            >
                              {producto.estado}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 italic">
                      No hay productos registrados.
                    </p>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                      Observador
                    </p>
                    <h3 className="text-lg font-bold text-amber-900">
                      Observaciones del estudiante
                    </h3>
                  </div>
                  <span className="w-fit rounded-full border border-amber-200 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {detalles.observaciones?.length || 0} registros
                  </span>
                </div>
                {detalles.observaciones && detalles.observaciones.length > 0 ? (
                  <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 sm:max-h-72 sm:pr-2">
                    {detalles.observaciones.map((observacion, indice) => (
                      <article
                        key={indice}
                        className="overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm"
                      >
                        <div className="border-b border-slate-100 bg-slate-50 px-3 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex min-w-0 flex-wrap gap-1.5">
                              <ObservacionPill
                                label="Periodo"
                                value={observacion.periodo || "N/A"}
                              />
                              <ObservacionPill
                                label="Materia"
                                value={observacion.materia || "Sin materia"}
                              />
                              <ObservacionPill
                                label="Profesor"
                                value={observacion.profesor || "Sin profesor"}
                              />
                            </div>
                            {observacion.fecha && (
                              <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                                {observacion.fecha}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-3">
                          <ObservacionDimension
                            titulo="Conductual / Disciplinario"
                            texto={observacion.conductual}
                            className="border-purple-100 bg-purple-50 text-purple-900"
                          />
                          <ObservacionDimension
                            titulo="Cognitivo"
                            texto={observacion.cognitivo}
                            className="border-emerald-100 bg-emerald-50 text-emerald-900"
                          />
                          <ObservacionDimension
                            titulo="Lenguaje"
                            texto={observacion.lenguaje}
                            className="border-sky-100 bg-sky-50 text-sky-900"
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-amber-200 bg-white px-4 py-6 text-center text-sm font-medium text-slate-500">
                    No hay observaciones registradas
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No se pudo cargar la información.
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
          <button
            onClick={onCerrar}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ObservacionPill({ label, value }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
      <span className="shrink-0 uppercase tracking-wide text-slate-400">
        {label}:
      </span>
      <span className="min-w-0 truncate">{value}</span>
    </span>
  );
}

function ObservacionDimension({ titulo, texto, className }) {
  return (
    <section className={`rounded-lg border p-3 ${className}`}>
      <p className="mb-1 text-[10px] font-black uppercase tracking-widest">
        {titulo}
      </p>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {texto || "Sin registro"}
      </p>
    </section>
  );
}
