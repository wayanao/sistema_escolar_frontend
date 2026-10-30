import EncabezadoAnotacion from "./EncabezadoAnotacion";
import SelloFirma from "./SelloFirma";
import {
  dimensionesConTextoDeAnotacion,
  formatearFechaAnotacion,
} from "../../utils/observador/anotaciones";

/**
 * Una anotación en la vista **por fecha**: una sola tarjeta que enumera sus
 * dimensiones con su nombre delante.
 *
 * Es al revés que la vista por dimensión, donde una anotación se reparte entre
 * varios bloques. **Mismo dato, otra manera de mirarlo**: cambiar de vista no
 * pide nada al servidor.
 *
 * Presentacional: sin hooks propios y sin HTTP.
 */
export default function AnotacionCronologica({ anotacion, esPropia, onEditar, onFirmar }) {
  const dimensiones = dimensionesConTextoDeAnotacion(anotacion);
  const editada = Boolean(anotacion.editada_en);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <EncabezadoAnotacion
        anotacion={anotacion}
        esPropia={esPropia}
        onEditar={onEditar}
        onFirmar={onFirmar}
        fechaPrimero
      />

      <dl className="mt-1 space-y-1">
        {dimensiones.map((dimension) => (
          <div key={dimension.campo} className="text-sm">
            <dt className="inline font-medium text-slate-600">
              {`${dimension.titulo}: `}
            </dt>
            <dd className="inline whitespace-pre-line text-slate-700">
              {dimension.texto}
            </dd>
          </div>
        ))}
      </dl>

      {editada && (
        <p className="mt-1 text-xs text-slate-500">
          Editada el {formatearFechaAnotacion(anotacion.editada_en)}
        </p>
      )}

      <SelloFirma firma={anotacion.firma} />
    </article>
  );
}
