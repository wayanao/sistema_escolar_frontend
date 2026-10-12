import { useEffect, useRef } from "react";
import {
  SALIDA_EGRESADO,
  SALIDA_RETIRADO,
  etiquetaSalida,
  puedeMatricularseEnDestino,
} from "../../utils/anioLectivo";
import { formatMoney } from "../../utils/carteraTiposPago/formatos";
import { obtenerEtiquetaEstadoEstudiante } from "../../utils/estudiantesObservador/estudiantes";

const claseControl =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200";

const claseBotonSalida =
  "rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function MatriculasPreparacionView({
  anioActivo,
  anioPreparacion,
  cursosOrigen,
  cursosDestino,
  cursoOrigenId,
  cursoDestinoId,
  candidatos,
  seleccionados,
  cargandoPreparacion,
  cargandoCandidatos,
  promoviendo,
  guardandoSalidaId,
  resultado,
  editandoId = null,
  formularioEdicion = null,
  mensajeEdicion = "",
  errorEdicion = "",
  onCambiarOrigen,
  onCambiarDestino,
  onAlternarEstudiante,
  onMarcarSalida,
  onPromover,
  onEditarEstudiante,
}) {
  const cantidad = seleccionados.length;
  const valoresEspeciales = resultado?.valores_especiales_copiados ?? [];
  // El formulario de edición llega armado desde la página; mientras está
  // abierto, no se abre otro para no perder lo que se esté escribiendo.
  const edicionAbierta = Boolean(formularioEdicion);
  const refEdicion = useRef(null);

  // El formulario aparece encima de la lista: se lleva la pantalla hasta él.
  useEffect(() => {
    if (edicionAbierta) {
      refEdicion.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [edicionAbierta]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-gray-900">2. Matricular estudiantes</h2>
      <p className="mt-2 text-sm text-gray-600">
        Elige el curso de {anioActivo.anio}, su destino en {anioPreparacion.anio}{" "}
        y desmarca a quien no pasa con ese grupo. A quien no sigue en{" "}
        {anioPreparacion.anio}, márcalo como retirado o egresado.
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-medium text-gray-800">
          Curso de origen ({anioActivo.anio})
          <select
            value={cursoOrigenId}
            onChange={(event) => onCambiarOrigen(event.target.value)}
            disabled={cargandoPreparacion}
            className={claseControl}
          >
            <option value="">Seleccionar curso</option>
            {cursosOrigen.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre}{curso.jornada ? ` · ${curso.jornada}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-gray-800">
          Curso destino ({anioPreparacion.anio})
          <select
            value={cursoDestinoId}
            onChange={(event) => onCambiarDestino(event.target.value)}
            disabled={cargandoPreparacion || !cursosDestino.length}
            className={claseControl}
          >
            <option value="">Seleccionar curso</option>
            {cursosDestino.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre}{curso.jornada ? ` · ${curso.jornada}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!cargandoPreparacion && !cursosDestino.length && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Primero copia o crea los cursos del año {anioPreparacion.anio}.
        </p>
      )}

      {cargandoCandidatos && (
        <p className="mt-5 text-sm text-gray-600">Cargando estudiantes...</p>
      )}

      {cursoOrigenId && !cargandoCandidatos && candidatos.length === 0 && (
        <p className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          Este curso no tiene estudiantes para mostrar.
        </p>
      )}

      {(edicionAbierta || mensajeEdicion || errorEdicion) && (
        <div ref={refEdicion} className="mt-5 scroll-mt-4 space-y-3">
          {errorEdicion && (
            <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {errorEdicion}
            </div>
          )}
          {mensajeEdicion && (
            <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
              {mensajeEdicion}
            </div>
          )}
          {edicionAbierta && (
            <>
              <p className="text-sm text-gray-600">
                El curso de este formulario es el de {anioActivo.anio}. El de{" "}
                {anioPreparacion.anio} se elige con &quot;Curso destino&quot;.
              </p>
              {formularioEdicion}
            </>
          )}
        </div>
      )}

      {candidatos.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-gray-800">
            {cantidad} de {candidatos.length} seleccionados
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {candidatos.map((candidato) => {
              const yaMatriculado = candidato.matriculado_en_destino;
              const marca = candidato.estado_salida;
              const disponible = puedeMatricularseEnDestino(candidato);
              const nombreCompleto = `${candidato.nombre} ${candidato.apellido}`;
              const bloqueado = promoviendo || guardandoSalidaId === candidato.id;
              return (
                <div
                  key={candidato.id}
                  className={`min-w-0 rounded-lg border p-3 ${
                    disponible
                      ? "border-gray-200 bg-white text-gray-900"
                      : "border-gray-200 bg-gray-100 text-gray-500"
                  }`}
                >
                  <label className="flex min-w-0 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(candidato.id)}
                      disabled={!disponible}
                      onChange={() => onAlternarEstudiante(candidato.id)}
                      aria-label={nombreCompleto}
                      className="mt-1 h-4 w-4 shrink-0"
                    />
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold">
                        {candidato.nombre} {candidato.apellido}
                      </span>
                      <span className="block break-words text-xs">
                        {candidato.documento_identidad || "Sin documento"} ·{" "}
                        {obtenerEtiquetaEstadoEstudiante(candidato.estado)}
                      </span>
                      {yaMatriculado && (
                        <span className="mt-1 block text-xs font-semibold text-emerald-700">
                          Ya matriculado en {anioPreparacion.anio}
                        </span>
                      )}
                      {marca && (
                        <span className="mt-1 block text-xs font-semibold text-amber-800">
                          No sigue en {anioPreparacion.anio} · {etiquetaSalida(marca)}
                        </span>
                      )}
                    </span>
                  </label>

                  <div className="mt-2 flex flex-wrap gap-2 pl-7">
                    <button
                      type="button"
                      onClick={() => onEditarEstudiante(candidato.id)}
                      disabled={promoviendo || edicionAbierta || editandoId !== null}
                      aria-label={`Editar datos de ${nombreCompleto}`}
                      className={claseBotonSalida}
                    >
                      Editar datos
                    </button>
                    {!yaMatriculado && marca && (
                      <button
                        type="button"
                        onClick={() => onMarcarSalida(candidato.id, null)}
                        disabled={bloqueado}
                        aria-label={`Quitar la marca de ${nombreCompleto}`}
                        className={claseBotonSalida}
                      >
                        Quitar marca
                      </button>
                    )}
                    {!yaMatriculado && !marca && (
                      <>
                        <button
                          type="button"
                          onClick={() => onMarcarSalida(candidato.id, SALIDA_RETIRADO)}
                          disabled={bloqueado}
                          aria-label={`Marcar a ${nombreCompleto} como retirado`}
                          className={claseBotonSalida}
                        >
                          Retirado
                        </button>
                        <button
                          type="button"
                          onClick={() => onMarcarSalida(candidato.id, SALIDA_EGRESADO)}
                          disabled={bloqueado}
                          aria-label={`Marcar a ${nombreCompleto} como egresado`}
                          className={claseBotonSalida}
                        >
                          Egresado
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onPromover}
            disabled={!cursoDestinoId || !cantidad || promoviendo}
            className="w-full rounded-lg bg-purple-700 px-5 py-2.5 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {promoviendo
              ? "Matriculando..."
              : `Matricular ${cantidad} ${cantidad === 1 ? "estudiante" : "estudiantes"}`}
          </button>
        </div>
      )}

      {resultado && (
        <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
          <p className="font-semibold">
            {resultado.cantidad_matriculados}{" "}
            {resultado.cantidad_matriculados === 1 ? "estudiante matriculado" : "estudiantes matriculados"}{" "}
            correctamente.
          </p>
          {valoresEspeciales.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold">Valores especiales copiados</h3>
              <p className="text-sm">Revísalos antes de empezar los cobros de {anioPreparacion.anio}.</p>
              <ul className="mt-3 grid gap-3 lg:grid-cols-2">
                {valoresEspeciales.map((valor) => (
                  <li key={valor.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {resultado.nombresPorId?.[valor.estudiante_id] || `Estudiante #${valor.estudiante_id}`}
                        </p>
                        <p>{valor.tipo_pago_nombre} · {formatMoney(valor.valor)}</p>
                        {valor.motivo && <p className="text-xs">{valor.motivo}</p>}
                      </div>
                      <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-900">
                        Revisar
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
