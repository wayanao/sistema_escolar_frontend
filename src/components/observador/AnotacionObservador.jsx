import EncabezadoAnotacion from "./EncabezadoAnotacion";
import { formatearFechaAnotacion } from "../../utils/observador/anotaciones";

/**
 * Una anotación en la vista **por dimensión**, con el texto de la dimensión
 * bajo la que se está mostrando.
 *
 * La misma anotación puede pintarse varias veces -una por cada dimensión que
 * tenga texto-, y por eso el texto llega por prop en vez de sacarlo de dentro.
 *
 * El encabezado -quién, cuándo y `[Editar]`- vive en `EncabezadoAnotacion`,
 * compartido con la vista por fecha para que las dos no puedan decir cosas
 * distintas de la misma anotación.
 *
 * Presentacional: sin hooks propios y sin HTTP.
 */
export default function AnotacionObservador({ anotacion, texto, esPropia, onEditar }) {
  const editada = Boolean(anotacion.editada_en);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <EncabezadoAnotacion
        anotacion={anotacion}
        esPropia={esPropia}
        onEditar={onEditar}
      />

      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{texto}</p>

      {editada && (
        <p className="mt-1 text-xs text-slate-500">
          Editada el {formatearFechaAnotacion(anotacion.editada_en)}
        </p>
      )}
    </article>
  );
}
