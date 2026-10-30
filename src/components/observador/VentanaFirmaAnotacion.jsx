import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import RecuadroFirma from "./RecuadroFirma";
import {
  dimensionesConTextoDeAnotacion,
  formatearFechaAnotacion,
  formatearPeriodoAnotacion,
} from "../../utils/observador/anotaciones";
import {
  MAX_DATO_FIRMANTE,
  MAX_NOMBRE_FIRMANTE,
  opcionesTipoDocumento,
  SUGERENCIAS_PARENTESCO,
  textoSelloFirma,
} from "../../utils/observador/firma";

const CLASE_CAMPO =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500";

/** Una anotación tal como la lee el acudiente: cuándo, quién, el periodo y el
 * texto completo de cada dimensión. */
function TextoAnotacion({ anotacion }) {
  const encabezado = [
    formatearFechaAnotacion(anotacion?.creada_en),
    anotacion?.profesor,
    formatearPeriodoAnotacion(anotacion?.periodo),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="space-y-1">
      {encabezado && <p className="text-xs text-slate-500">{encabezado}</p>}
      <dl className="space-y-1">
        {dimensionesConTextoDeAnotacion(anotacion).map((dimension) => (
          <div key={dimension.campo} className="text-sm">
            <dt className="inline font-medium text-slate-600">{`${dimension.titulo}: `}</dt>
            <dd className="inline whitespace-pre-line text-slate-800">{dimension.texto}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

/**
 * La ventana donde el acudiente lee lo que va a firmar y lo firma en pantalla.
 * Ver `docs/funcionalidades/FIRMA_OBSERVADOR.md`.
 *
 * Arriba, **el texto completo de lo que se firma**: una anotación, o todas las
 * pendientes de un periodo cuando se firma el periodo de una vez (`periodo`,
 * con botones para cambiar de periodo si hay varios). Después, quién firma -el
 * papá o la mamá de la ficha, u otro acudiente-, el recuadro de firma y la
 * casilla de lectura. "Guardar firma" solo se activa con todo completo, y al
 * lado se dice qué falta.
 *
 * Va en un portal sobre `document.body`, por encima de la ficha del admin, que
 * también es una ventana. En el celular ocupa toda la pantalla. **No se cierra
 * al tocar fuera**: un dedo que se resbala mientras firman no puede borrar lo
 * hecho. Se cierra con la X, con "Cancelar" o con Esc.
 *
 * Presentacional: el estado vive en `useFirmaAnotacion`.
 */
export default function VentanaFirmaAnotacion({
  titulo,
  anotaciones = [],
  periodo = null,
  periodos = [],
  onCambiarPeriodo,
  firmante,
  onCambiarFirmante,
  sugeridos = [],
  cargandoSugeridos = false,
  onElegirSugerido,
  onCambiarImagen,
  leida,
  onCambiarLeida,
  falta,
  guardando = false,
  error,
  firmada,
  haySiguiente = false,
  onGuardar,
  onFirmarSiguiente,
  onCerrar,
}) {
  const idTitulo = useId();
  const idLectura = useId();
  const idParentescos = useId();
  const dialogoRef = useRef(null);

  // Al cerrar, el foco vuelve al botón que abrió la ventana.
  useEffect(() => {
    const anterior = document.activeElement;
    return () => {
      if (anterior && typeof anterior.focus === "function") anterior.focus();
    };
  }, []);

  // Qué se está firmando: una anotación o un periodo. Con cada cambio
  // -"Firmar la siguiente" u otro periodo- el foco entra en la ventana, para
  // que el lector de pantalla empiece por su título, y el recuadro de firma
  // vuelve a estar en blanco.
  const esPeriodo = periodo !== null;
  const clave = esPeriodo ? `periodo-${periodo}` : `anotacion-${anotaciones[0]?.id}`;
  useEffect(() => {
    dialogoRef.current?.focus();
  }, [clave]);

  const alPulsarTecla = (evento) => {
    if (evento.key === "Escape" && !guardando) {
      evento.stopPropagation();
      onCerrar();
    }
  };

  const cantidad = anotaciones.length;
  const textoLectura =
    esPeriodo && cantidad !== 1
      ? `El acudiente leyó estas ${cantidad} anotaciones.`
      : "El acudiente leyó esta anotación.";

  // El cuerpo se desplaza por dentro y la barra de botones queda siempre
  // visible. El `<fieldset>` -que deshabilita todo mientras se guarda- va
  // DENTRO de la zona que se desplaza y no es él quien reparte el alto: como
  // contenedor flexible, algunos navegadores no lo encogen, la ventana crecía
  // por debajo de la pantalla y "Guardar firma" quedaba fuera de la vista
  // (visto el 2026-10-27 con la pantalla de Windows escalada).
  const formulario = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        <fieldset disabled={guardando} className="min-w-0 space-y-4">
          <section
            aria-labelledby={idLectura}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
          >
            <h4 id={idLectura} className="text-xs font-bold uppercase tracking-wide text-slate-600">
              Lo que el acudiente lee y firma
            </h4>

            {esPeriodo && periodos.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Periodo que se firma">
                {periodos.map((opcion) => (
                  <button
                    key={opcion.periodo}
                    type="button"
                    onClick={() => onCambiarPeriodo(opcion.periodo)}
                    aria-pressed={opcion.periodo === periodo}
                    className={`rounded-lg border px-3 py-1 text-xs font-medium ${
                      opcion.periodo === periodo
                        ? "border-purple-600 bg-purple-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {`Periodo ${opcion.periodo} (${opcion.cantidad})`}
                  </button>
                ))}
              </div>
            )}

            {esPeriodo && (
              <p className="mt-2 text-sm font-medium text-slate-700">
                {cantidad === 1
                  ? `Periodo ${periodo}: 1 anotación por firmar.`
                  : `Periodo ${periodo}: ${cantidad} anotaciones por firmar, con una sola firma.`}
              </p>
            )}

            <div className="mt-2 divide-y divide-slate-200">
              {anotaciones.map((anotacion) => (
                <div key={anotacion.id} className="py-2 first:pt-0 last:pb-0">
                  <TextoAnotacion anotacion={anotacion} />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">¿Quién firma?</h4>

            {cargandoSugeridos && (
              <p className="text-xs text-slate-500">Buscando al papá y a la mamá en la ficha...</p>
            )}

            {sugeridos.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Acudientes de la ficha">
                {sugeridos.map((sugerido) => (
                  <button
                    key={`${sugerido.parentesco}-${sugerido.nombre}`}
                    type="button"
                    onClick={() => onElegirSugerido(sugerido)}
                    className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-800 hover:bg-purple-100"
                  >
                    {`${sugerido.parentesco}: ${sugerido.nombre}`}
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-slate-700 sm:col-span-2">
                Nombre completo
                <input
                  type="text"
                  value={firmante.nombre}
                  onChange={(evento) => onCambiarFirmante("nombre", evento.target.value)}
                  maxLength={MAX_NOMBRE_FIRMANTE}
                  autoComplete="off"
                  className={CLASE_CAMPO}
                />
              </label>
              <label className="block text-sm text-slate-700">
                Tipo de documento
                <select
                  value={firmante.tipoDocumento}
                  onChange={(evento) => onCambiarFirmante("tipoDocumento", evento.target.value)}
                  className={CLASE_CAMPO}
                >
                  {opcionesTipoDocumento(firmante.tipoDocumento).map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-700">
                Número de documento
                <input
                  type="text"
                  value={firmante.documento}
                  onChange={(evento) => onCambiarFirmante("documento", evento.target.value)}
                  maxLength={MAX_DATO_FIRMANTE}
                  autoComplete="off"
                  className={CLASE_CAMPO}
                />
              </label>
              <label className="block text-sm text-slate-700 sm:col-span-2">
                Parentesco
                <input
                  type="text"
                  list={idParentescos}
                  value={firmante.parentesco}
                  onChange={(evento) => onCambiarFirmante("parentesco", evento.target.value)}
                  maxLength={MAX_DATO_FIRMANTE}
                  autoComplete="off"
                  className={CLASE_CAMPO}
                />
              </label>
              <datalist id={idParentescos}>
                {SUGERENCIAS_PARENTESCO.map((parentesco) => (
                  <option key={parentesco} value={parentesco} />
                ))}
              </datalist>
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-800">Firma</h4>
            {/* La `key` empieza un recuadro en blanco con cada anotación. */}
            <RecuadroFirma
              key={clave}
              onCambio={onCambiarImagen}
              deshabilitado={guardando}
            />
          </section>

          <label className="flex items-start gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={leida}
              onChange={(evento) => onCambiarLeida(evento.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-purple-600"
            />
            {textoLectura}
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          )}
        </fieldset>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-end sm:rounded-b-lg">
        {falta && <p className="text-xs text-slate-500 sm:mr-auto">{falta}</p>}
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
          disabled={Boolean(falta) || guardando}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {guardando
            ? "Guardando..."
            : esPeriodo && cantidad > 1
              ? `Guardar firma (${cantidad})`
              : "Guardar firma"}
        </button>
      </div>
    </>
  );

  const exito = (
    <>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
          <span className="block font-semibold">
            {Array.isArray(firmada) && firmada.length > 1
              ? `Firma guardada en ${firmada.length} anotaciones.`
              : "Firma guardada."}
          </span>
          {textoSelloFirma(Array.isArray(firmada) ? firmada[0] : firmada)}
        </p>
        <p className="text-sm text-slate-700">
          {esPeriodo
            ? "Lo firmado ya no se puede editar. Si queda otro periodo por firmar, ábrelo con «Firmar un periodo»."
            : haySiguiente
              ? "Este estudiante tiene otra anotación sin firmar. Los datos de quien firma se conservan; la firma se dibuja otra vez."
              : "No quedan anotaciones de este estudiante que puedas firmar."}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 border-t border-slate-200 px-5 py-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cerrar
        </button>
        {haySiguiente && (
          <button
            type="button"
            onClick={onFirmarSiguiente}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Firmar la siguiente
          </button>
        )}
      </div>
    </>
  );

  // `overflow-y-auto` en el fondo es la red de seguridad: si la ventana llegara
  // a medir más que la pantalla, se puede bajar hasta sus botones.
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
        className="flex h-full w-full flex-col bg-white shadow-xl focus:outline-none sm:h-auto sm:max-h-[92vh] sm:max-w-xl sm:rounded-lg"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 bg-purple-700 px-5 py-4 text-white sm:rounded-t-lg">
          <div className="min-w-0">
            <h3 id={idTitulo} className="text-lg font-bold">
              Firma del acudiente
            </h3>
            {titulo && <p className="truncate text-sm text-purple-100">{titulo}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
            className="shrink-0 text-white hover:text-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {firmada ? exito : formulario}
      </div>
    </div>,
    document.body,
  );
}
