import {
  describirMarcaAnotacion,
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
 * ninguna vista y para nadie (invariante 2). El botón de editar llega en la
 * fase 2.
 */
export default function AnotacionObservador({ anotacion, texto }) {
  const marca = describirMarcaAnotacion(anotacion.positiva);
  const fecha = formatearFechaAnotacion(anotacion.creada_en);
  const periodo = formatearPeriodoAnotacion(anotacion.periodo);
  const editada = Boolean(anotacion.editada_en);

  const encabezado = [anotacion.profesor || "Profesor sin nombre", fecha, periodo]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <header className="flex items-start gap-2">
        <span aria-hidden="true">{marca.simbolo}</span>
        <span className="sr-only">{marca.etiqueta}</span>
        <p className="text-sm font-semibold text-slate-800">{encabezado}</p>
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
