import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AVISO_RENOMBRAR_CUADROS,
  CUADROS_PLAN,
  LARGO_AYUDA_CUADRO,
  LARGO_NOMBRE_CUADRO,
  RECIBE_CUADRO,
} from "../../../utils/planeaciones/cuadros";

const CLASE_CAMPO =
  "mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2";
const CLASE_CAMPO_BIEN = "border-slate-300 focus:border-violet-500 focus:ring-violet-100";
const CLASE_CAMPO_ERROR = "border-rose-400 focus:border-rose-500 focus:ring-rose-100";

/**
 * La ventana donde el admin renombra los cuadros del plan de clase. Ver
 * docs/funcionalidades/NOMBRES_CUADROS_PLAN.md.
 *
 * Arriba, el aviso de que renombrar no cambia lo que recibe el cuadro ni borra
 * lo escrito. Después, una fila por cuadro en el orden del formulario: el
 * nombre original, el nombre, el texto de ayuda (solo en los de texto) y qué
 * recibe. Mientras no se pudieron leer los nombres actuales, no hay campos y
 * "Guardar" está desactivado.
 *
 * Va en un portal y en el celular ocupa toda la pantalla. No se cierra al
 * tocar fuera, para no perder lo escrito; se cierra con la X, "Cancelar" o
 * Esc. Presentacional: el estado vive en `useEdicionCuadrosPlanAdmin`.
 */
export default function VentanaCuadrosPlanAdmin({
  cuadros,
  valores,
  errores = {},
  error = "",
  cargando = false,
  errorLectura = "",
  guardando = false,
  onCambiar,
  onVolverAOriginales,
  onGuardar,
  onReintentar,
  onCerrar,
}) {
  const idTitulo = useId();
  const dialogoRef = useRef(null);
  const disponible = !cargando && !errorLectura;

  // Al abrir, el foco entra en la ventana; al cerrar, vuelve al botón que la
  // abrió.
  useEffect(() => {
    const anterior = document.activeElement;
    dialogoRef.current?.focus();
    return () => {
      if (anterior && typeof anterior.focus === "function") anterior.focus();
    };
  }, []);

  const alPulsarTecla = (evento) => {
    if (evento.key === "Escape" && !guardando) {
      evento.stopPropagation();
      onCerrar();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center overflow-y-auto bg-black/50 sm:items-center sm:p-4">
      <div
        ref={dialogoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-busy={guardando}
        tabIndex={-1}
        onKeyDown={alPulsarTecla}
        className="flex h-full w-full flex-col bg-white shadow-xl focus:outline-none sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-lg"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 bg-violet-700 px-5 py-4 text-white sm:rounded-t-lg">
          <div className="min-w-0">
            <h3 id={idTitulo} className="text-lg font-bold">
              Nombres de los cuadros
            </h3>
            <p className="text-sm text-violet-100">
              Plan de clase · valen para todos los profesores del colegio
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="shrink-0 text-white hover:text-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {AVISO_RENOMBRAR_CUADROS}
          </p>

          {cargando && (
            <p role="status" className="mt-4 text-sm text-slate-600">
              Cargando los nombres actuales...
            </p>
          )}

          {!cargando && errorLectura && (
            <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800">
              <p>{errorLectura} Sin leerlos no se puede guardar, para no borrar los que ya tiene el colegio.</p>
              <button
                type="button"
                onClick={onReintentar}
                className="mt-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-100"
              >
                Reintentar
              </button>
            </div>
          )}

          {disponible && (
            <fieldset disabled={guardando} className="mt-4 min-w-0 space-y-3">
              <legend className="sr-only">Cuadros del plan de clase</legend>
              {CUADROS_PLAN.map(({ clave }) => (
                <FilaCuadro
                  key={clave}
                  cuadro={cuadros[clave]}
                  valor={valores[clave]}
                  errores={errores[clave]}
                  onCambiar={(campo, texto) => onCambiar(clave, campo, texto)}
                />
              ))}
            </fieldset>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:rounded-b-lg">
          <button
            type="button"
            onClick={onVolverAOriginales}
            disabled={!disponible || guardando}
            className="rounded-lg px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mr-auto"
          >
            Volver a los originales
          </button>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onGuardar}
            disabled={!disponible || guardando}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function FilaCuadro({ cuadro, valor, errores = {}, onCambiar }) {
  const idNombre = useId();
  const idAyuda = useId();
  const idRecibe = useId();
  const idErrorNombre = useId();
  const idErrorAyuda = useId();
  const esTexto = cuadro.tipo === "texto";

  return (
    <div role="group" className="rounded-xl border border-slate-200 p-3" aria-label={`Cuadro ${cuadro.nombreOriginal}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Original: {cuadro.nombreOriginal}
      </p>

      <label htmlFor={idNombre} className="mt-2 block text-sm font-medium text-slate-700">
        Nombre
      </label>
      <input
        id={idNombre}
        type="text"
        value={valor.nombre}
        maxLength={LARGO_NOMBRE_CUADRO}
        onChange={(evento) => onCambiar("nombre", evento.target.value)}
        aria-invalid={Boolean(errores.nombre)}
        aria-describedby={[idRecibe, errores.nombre ? idErrorNombre : ""].filter(Boolean).join(" ")}
        className={`${CLASE_CAMPO} ${errores.nombre ? CLASE_CAMPO_ERROR : CLASE_CAMPO_BIEN}`}
      />
      {errores.nombre && (
        <p id={idErrorNombre} className="mt-1 text-xs text-rose-700">
          {errores.nombre}
        </p>
      )}

      {esTexto && (
        <>
          <label htmlFor={idAyuda} className="mt-3 block text-sm font-medium text-slate-700">
            Texto de ayuda
            <span className="ml-1 font-normal text-slate-500">(el texto gris dentro del cuadro vacío)</span>
          </label>
          <input
            id={idAyuda}
            type="text"
            value={valor.ayuda}
            maxLength={LARGO_AYUDA_CUADRO}
            onChange={(evento) => onCambiar("ayuda", evento.target.value)}
            aria-invalid={Boolean(errores.ayuda)}
            aria-describedby={errores.ayuda ? idErrorAyuda : undefined}
            className={`${CLASE_CAMPO} ${errores.ayuda ? CLASE_CAMPO_ERROR : CLASE_CAMPO_BIEN}`}
          />
          {errores.ayuda && (
            <p id={idErrorAyuda} className="mt-1 text-xs text-rose-700">
              {errores.ayuda}
            </p>
          )}
        </>
      )}

      <p id={idRecibe} className="mt-3 text-xs text-slate-600">
        <span className="font-semibold text-slate-700">Qué recibe: </span>
        {esTexto ? RECIBE_CUADRO.texto : RECIBE_CUADRO.archivo}
      </p>
    </div>
  );
}
