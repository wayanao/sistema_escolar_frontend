import DeudasAniosAnterioresView from "../../anioLectivo/DeudasAniosAnterioresView";
import ObservadorEnFichaAdmin from "../../observador/ObservadorEnFichaAdmin";
import RendimientoEstudianteAdmin from "./RendimientoEstudianteAdmin";

/**
 * Ficha del alumno para el admin. Desde el 2026-09-10 la sección «Observador»
 * monta **la misma vista que ve la profesora**, en solo lectura, en vez de
 * listar las observaciones de la tabla vieja. Ver
 * `docs/funcionalidades/OBSERVADOR_ESTUDIANTE.md`.
 */
export default function DetalleEstudianteAdmin({
  estudiante,
  cursos,
  detalles,
  cargando,
  onCerrar,
  // Paso E6 de la entrevista de admisión. Sin `onVerDatosAdmision`, la
  // sección no aparece.
  datosAdmision = null,
  cargandoDatosAdmision = false,
  errorDatosAdmision = null,
  onVerDatosAdmision,
  // Paso E11b: las respuestas del anexo de su entrevista, ya en texto.
  respuestasAdmision = null,
  errorRespuestasAdmision = null,
  // Notas por periodo (NOTAS_RESUMEN_ESTUDIANTE.md): el periodo que se mira
  // en "Rendimiento" y cómo cambiarlo.
  periodoResumen = "1",
  onCambiarPeriodoResumen,
}) {
  if (!estudiante) return null;

  const hayDeudasAnteriores = (detalles?.deuda_anios_anteriores || []).some(
    (item) => Number(item?.total_deuda || 0) > 0,
  );

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
              <RendimientoEstudianteAdmin
                detalles={detalles}
                periodo={periodoResumen}
                onCambiarPeriodo={onCambiarPeriodoResumen}
              />

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
                        {hayDeudasAnteriores
                          ? "Sin deudas pendientes en el año consultado."
                          : "Sin deudas pendientes."}
                      </p>
                    </div>
                  )}
                </div>

                <DeudasAniosAnterioresView
                  deudasAnios={detalles.deuda_anios_anteriores}
                  className="mb-4"
                />

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

              <ObservadorEnFichaAdmin estudiante={estudiante} />

              {onVerDatosAdmision && (
                <DatosAdmision
                  datos={datosAdmision}
                  cargando={cargandoDatosAdmision}
                  error={errorDatosAdmision}
                  onVer={onVerDatosAdmision}
                  respuestas={respuestasAdmision}
                  errorRespuestas={errorRespuestasAdmision}
                />
              )}
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

// Las respuestas del anexo de su entrevista (paso E11b), de solo lectura y por
// sección. Llegan aparte: si fallan, los datos de arriba se ven igual.
function RespuestasEntrevista({ respuestas, error, cargando }) {
  let contenido;
  if (error) {
    contenido = (
      <p className="text-sm text-red-700">No se pudieron cargar las respuestas de la entrevista.</p>
    );
  } else if (!respuestas) {
    if (!cargando) return null;
    contenido = <p className="text-sm text-gray-600">Cargando respuestas de la entrevista...</p>;
  } else if (respuestas.admisionId === null) {
    contenido = <p className="text-sm text-gray-600 italic">Sin entrevista de admisión.</p>;
  } else if (respuestas.secciones.length === 0) {
    contenido = (
      <p className="text-sm text-gray-600 italic">La entrevista no tiene respuestas del anexo.</p>
    );
  } else {
    contenido = (
      <div className="space-y-4">
        {respuestas.secciones.map((seccion) => (
          <div key={seccion.clave}>
            <h5 className="mb-2 text-sm font-semibold text-emerald-900">{seccion.titulo}</h5>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {seccion.respuestas.map(({ clave, pregunta, respuesta }) => (
                <div key={clave} className="bg-white px-2 py-1 rounded shadow-sm">
                  <dt className="text-gray-600">{pregunta}</dt>
                  <dd className="font-medium text-gray-900 break-words">{respuesta}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    );
  }

  const titulo = respuestas?.anio
    ? `Respuestas de la entrevista (admisión ${respuestas.anio})`
    : "Respuestas de la entrevista";
  return (
    <div className="mt-4 border-t border-emerald-200 pt-3">
      <h4 className="mb-2 font-semibold text-emerald-900">{titulo}</h4>
      {contenido}
    </div>
  );
}

// Estudios anteriores y ocupación de los padres, de solo lectura: salieron del
// formulario y pasaron a la entrevista de admisión (paso E6). En quien entró
// por una admisión vienen de su entrevista; en los de antes, lo que ya tenían.
// Debajo, las respuestas del anexo de la entrevista (paso E11b).
function DatosAdmision({ datos, cargando, error, onVer, respuestas, errorRespuestas }) {
  const hayAlguno = datos?.some((dato) => dato.valor !== null);

  return (
    <section className="md:col-span-2 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
      <h3 className="text-lg font-semibold text-emerald-900 mb-2 flex items-center gap-2">
        🗂️ Datos de admisión
      </h3>
      <p className="text-sm text-gray-700 mb-3">
        Estudios anteriores y ocupación de los padres. En quien entró por una admisión,
        vienen de su entrevista, junto con sus respuestas del anexo.
      </p>
      {datos ? (
        <>
          {hayAlguno ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {datos.map(({ campo, etiqueta, valor }) => (
                <div key={campo} className="flex justify-between gap-3 bg-white px-2 py-1 rounded shadow-sm">
                  <dt className="font-medium text-gray-700">{etiqueta}</dt>
                  <dd className="text-right text-gray-900 break-words">{valor ?? "—"}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-gray-600 italic">Sin datos de admisión guardados.</p>
          )}
          <RespuestasEntrevista respuestas={respuestas} error={errorRespuestas} cargando={cargando} />
        </>
      ) : cargando ? (
        <p className="text-sm text-gray-600">Cargando datos de admisión...</p>
      ) : (
        <>
          {error && (
            <p className="text-sm text-red-700 mb-2">
              No se pudieron cargar los datos de admisión.
            </p>
          )}
          <button
            type="button"
            onClick={onVer}
            className="w-full sm:w-auto rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Ver datos de admisión
          </button>
        </>
      )}
    </section>
  );
}
