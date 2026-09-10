import {
  formatearFechaAnotacion,
  formatearPeriodoAnotacion,
} from "../../utils/observador/anotaciones";
import { colorDeProfesor } from "../../utils/observador/coloresProfesor";

/**
 * Quién escribió una anotación y cuándo: profesor, fecha y periodo.
 *
 * Lo comparten las dos vistas —por dimensión y por fecha— para que no puedan
 * decir cosas distintas de la misma anotación.
 *
 * El nombre lleva **el color del profesor**; la fecha y el periodo se quedan
 * grises. El color acompaña, no sustituye: el nombre sigue escrito.
 *
 * Presentacional: sin hooks propios y sin HTTP. **No hay botón de borrar**, en
 * ninguna vista y para nadie (invariante 2). `[Editar]` se pinta únicamente en
 * las anotaciones propias, y es comodidad visual: la regla de verdad la impone
 * el servidor, que responde 403 a quien intente corregir lo de otro.
 */
export default function EncabezadoAnotacion({
  anotacion,
  esPropia,
  onEditar,
  fechaPrimero = false,
}) {
  const profesor = anotacion.profesor || "Profesor sin nombre";
  const color = colorDeProfesor(anotacion.profesor_id);
  const fecha = formatearFechaAnotacion(anotacion.creada_en);
  const periodo = formatearPeriodoAnotacion(anotacion.periodo);

  // En la vista por fecha manda la fecha, así que va delante; en la vista por
  // dimensión manda quién lo dijo.
  const acompanantes = fechaPrimero
    ? [periodo].filter(Boolean)
    : [fecha, periodo].filter(Boolean);

  return (
    <header className="flex items-start gap-2">
      <p className="flex-1 text-sm">
        {fechaPrimero && <span className="text-slate-500">{`${fecha} · `}</span>}
        <span className={`font-semibold ${color}`}>{profesor}</span>
        {acompanantes.length > 0 && (
          <span className="text-slate-500">{` · ${acompanantes.join(" · ")}`}</span>
        )}
      </p>

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
  );
}
