import {
  formatearFechaAnotacion,
  formatearPeriodoAnotacion,
} from "../../utils/observador/anotaciones";

/**
 * Una anotación de la bitácora, con el texto de la dimensión bajo la que se
 * está mostrando.
 *
 * La misma anotación puede pintarse varias veces -una por cada dimensión que
 * tenga texto-, y por eso el texto llega por prop en vez de sacarlo de dentro.
 *
 * Presentacional: sin hooks propios y sin HTTP. **No hay botón de borrar**, en
 * ninguna vista y para nadie (invariante 2).
 *
 * `[Editar]` se pinta **únicamente** en las anotaciones propias, y es
 * comodidad visual: la regla de verdad la impone el servidor, que responde 403
 * si alguien intenta corregir lo de otro. El frontend no puede ser la única
 * defensa.
 */
export default function AnotacionObservador({ anotacion, texto, esPropia, onEditar }) {
  const fecha = formatearFechaAnotacion(anotacion.creada_en);
  const periodo = formatearPeriodoAnotacion(anotacion.periodo);
  const editada = Boolean(anotacion.editada_en);

  const encabezado = [anotacion.profesor || "Profesor sin nombre", fecha, periodo]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <header className="flex items-start gap-2">
        <p className="flex-1 text-sm font-semibold text-slate-800">{encabezado}</p>
        {esPropia && onEditar && (
          <button
            type="button"
            onClick={() => onEditar(anotacion)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Editar
          </button>
        )}
      </header>

      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{texto}</p>

      {editada && (
        <p className="mt-1 text-xs text-slate-500">
          Editada el {formatearFechaAnotacion(anotacion.editada_en)}
        </p>
      )}
    </article>
  );
}
