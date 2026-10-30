import EncabezadoAnotacion from "./EncabezadoAnotacion";
import SelloFirma from "./SelloFirma";
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
 * Si el acudiente la firmó, lleva su sello (`SelloFirma`) en cada bloque donde
 * aparece, igual que la marca de editada.
 *
 * Presentacional: sin hooks propios y sin HTTP.
 */
export default function AnotacionObservador({ anotacion, texto, esPropia, onEditar, onFirmar }) {
  const editada = Boolean(anotacion.editada_en);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <EncabezadoAnotacion
        anotacion={anotacion}
        esPropia={esPropia}
        onEditar={onEditar}
        onFirmar={onFirmar}
      />

      <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{texto}</p>

      {editada && (
        <p className="mt-1 text-xs text-slate-500">
          Editada el {formatearFechaAnotacion(anotacion.editada_en)}
        </p>
      )}

      <SelloFirma firma={anotacion.firma} />
    </article>
  );
}
