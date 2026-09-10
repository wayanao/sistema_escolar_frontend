import AnotacionObservador from "./AnotacionObservador";
import {
  agruparAnotacionesPorDimension,
  OPCIONES_PERIODO_OBSERVADOR,
  PERIODO_TODOS,
} from "../../utils/observador/anotaciones";
import { esAnotacionPropia } from "../../utils/observador/formulario";

/** Cuando no hay nada que mostrar, el aviso cambia según el selector: filtrar
 * por un periodo nunca oculta historial, así que si el filtro está puesto hay
 * que decir en voz alta que "Todos" enseña el año entero. */
function avisoSinAnotaciones(periodo) {
  return periodo === PERIODO_TODOS
    ? "Todavía nadie le ha escrito nada a este estudiante."
    : "No hay anotaciones en este periodo. Elige «Todos» para ver el año entero.";
}

/**
 * La bitácora de un estudiante, agrupada por dimensión.
 *
 * Presentacional: recibe las anotaciones ya cargadas y no pide nada. Cambiar
 * la agrupación **no** debe disparar otra petición.
 *
 * El formulario llega ya montado en `formulario`, y se pinta arriba tanto para
 * una anotación nueva como para corregir una propia. Va **una sola vez** aunque
 * la anotación aparezca bajo varias dimensiones: repetirlo tres veces sería
 * incomprensible.
 */
export default function VistaObservadorEstudiante({
  titulo,
  periodo,
  onCambiarPeriodo,
  anotaciones,
  cargando,
  error,
  onReintentar,
  onVolver,
  profesorId,
  onEditar,
  onNuevaAnotacion,
  formulario,
}) {
  const grupos = agruparAnotacionesPorDimension(anotaciones);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVolver}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Volver a la lista
          </button>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
            Observador de {titulo}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {onNuevaAnotacion && !formulario && (
            <button
              type="button"
              onClick={onNuevaAnotacion}
              className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Nueva anotación
            </button>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700">
            Periodo:
            <select
              value={periodo}
              onChange={(event) => onCambiarPeriodo(event.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
            >
              {OPCIONES_PERIODO_OBSERVADOR.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {formulario}

      {cargando && (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Cargando el observador...
        </p>
      )}

      {!cargando && error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p>{error}</p>
          {onReintentar && (
            <button
              type="button"
              onClick={onReintentar}
              className="mt-2 rounded-lg border border-rose-300 bg-white px-3 py-1 font-medium hover:bg-rose-100"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {!cargando && !error && grupos.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          {avisoSinAnotaciones(periodo)}
        </p>
      )}

      {!cargando
        && !error
        && grupos.map((grupo) => (
          <div key={grupo.campo} className="space-y-2">
            <h3 className="border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wide text-slate-700">
              {grupo.titulo}
            </h3>
            {grupo.entradas.map((entrada) => (
              <AnotacionObservador
                key={`${grupo.campo}-${entrada.anotacion.id}`}
                anotacion={entrada.anotacion}
                texto={entrada.texto}
                esPropia={esAnotacionPropia(entrada.anotacion, profesorId)}
                onEditar={onEditar}
              />
            ))}
          </div>
        ))}
    </section>
  );
}
