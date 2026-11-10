import { useState } from "react";

const TONOS = {
  rojo: { icono: "bg-rose-100 text-rose-700", borde: "border-rose-100", posicion: "bg-rose-100 text-rose-800" },
  ambar: { icono: "bg-amber-100 text-amber-700", borde: "border-amber-100", posicion: "bg-amber-100 text-amber-800" },
  verde: { icono: "bg-emerald-100 text-emerald-700", borde: "border-emerald-100", posicion: "bg-emerald-100 text-emerald-800" },
};

const LIMITE_FILAS_RESULTADO = 5;

/**
 * Molde común de los resultados del panel (2026-11-10): ícono de color, un
 * título en palabras simples, qué mide en una línea, hasta cinco filas con
 * «Ver todos» si hay más, y la acción de la tarjeta. Solo presenta.
 *
 * `filas` es una lista de `{ clave, posicion, nombre, detalle, valor,
 * valorClase, unidad }`; `estado` es el texto a mostrar en vez de la lista
 * (cargando, error o vacío), o `null`.
 */
function TarjetaResultadoProfesor({
  tono,
  icono,
  titulo,
  descripcion,
  etiquetas = [],
  filas,
  estado = null,
  estadoEsError = false,
  accion = null,
}) {
  const [verTodos, setVerTodos] = useState(false);
  const colores = TONOS[tono];
  const visibles = verTodos ? filas : filas.slice(0, LIMITE_FILAS_RESULTADO);
  const ocultas = filas.length - LIMITE_FILAS_RESULTADO;

  return (
    <article className={`flex h-full flex-col rounded-2xl border bg-white shadow-sm ${colores.borde}`}>
      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${colores.icono}`} aria-hidden="true">
          {icono}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight text-slate-950">{titulo}</h3>
          <p className="mt-0.5 text-sm text-slate-600">{descripcion}</p>
          {etiquetas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {etiquetas.map((etiqueta) => (
                <span key={etiqueta} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700" translate="no">
                  {etiqueta}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pb-3">
        {estado ? (
          <p
            className={`rounded-xl px-3 py-3 text-sm ${
              estadoEsError ? "border border-red-100 bg-red-50 font-semibold text-red-700" : "bg-slate-50 text-slate-600"
            }`}
          >
            {estado}
          </p>
        ) : (
          <ol className="space-y-2">
            {visibles.map((fila) => (
              <li key={fila.clave} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                <span className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-1 text-xs font-bold ${colores.posicion}`}>
                  {fila.posicion}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900" translate="no">{fila.nombre}</p>
                  <p className="truncate text-xs font-medium text-slate-500" translate="no">{fila.detalle}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-base font-black tabular-nums ${fila.valorClase || "text-slate-900"}`}>{fila.valor}</p>
                  {fila.unidad && <p className="text-[11px] font-semibold text-slate-500">{fila.unidad}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
        {!estado && ocultas > 0 && (
          <button
            type="button"
            onClick={() => setVerTodos((actual) => !actual)}
            className="mt-2 w-full rounded-xl px-3 py-2 text-sm font-bold text-purple-700 transition hover:bg-purple-50"
          >
            {verTodos ? "Ver menos" : `Ver todos (${filas.length})`}
          </button>
        )}
      </div>

      {accion && (
        <div className="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={accion.onClick}
            className="w-full rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-sm font-bold text-purple-800 transition hover:border-purple-300 hover:bg-purple-50"
          >
            {accion.texto}
          </button>
        </div>
      )}
    </article>
  );
}

export default TarjetaResultadoProfesor;
