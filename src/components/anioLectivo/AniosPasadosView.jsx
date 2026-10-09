import {
  accionDeAnioPasado,
  confirmacionCoincide,
  etiquetaAnioLectivo,
} from "../../utils/anioLectivo";

// Paso 6.8: los años cerrados y el reabierto, con su botón para reabrir o
// volver a cerrar escribiendo el año. Presentacional.
export default function AniosPasadosView({
  anios,
  anioEnCambio,
  confirmacion,
  guardando,
  onIniciar,
  onCancelar,
  onCambiarConfirmacion,
  onConfirmar,
}) {
  const idCampo = "confirmar-anio-pasado";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-gray-900">Años pasados</h2>
      <p className="mt-2 text-sm text-gray-600">
        Reabrir un año sirve para corregir algo puntual. Mientras esté reabierto,
        solo el administrador puede cambiar sus datos; los profesores no lo ven.
        Vuelve a cerrarlo al terminar. Solo puede haber un año reabierto a la vez.
      </p>

      <ul className="mt-4 space-y-3">
        {anios.map((anio) => {
          const accion = accionDeAnioPasado(anio);
          const confirmando = anioEnCambio?.id === anio.id;
          return (
            <li key={anio.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-gray-900">{etiquetaAnioLectivo(anio)}</span>
                {accion && !confirmando && (
                  <button
                    type="button"
                    onClick={() => onIniciar(anio)}
                    disabled={guardando}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {accion.etiqueta}
                  </button>
                )}
              </div>

              {accion && confirmando && (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="text-sm font-medium text-gray-800">
                    <label htmlFor={idCampo}>Escribe {anio.anio} para confirmar</label>
                    <input
                      id={idCampo}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={confirmacion}
                      onChange={(event) => onCambiarConfirmacion(event.target.value)}
                      disabled={guardando}
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 sm:w-40"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onConfirmar}
                    disabled={guardando || !confirmacionCoincide(confirmacion, anio.anio)}
                    className="w-full rounded-lg bg-purple-700 px-5 py-2.5 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {guardando ? "Guardando..." : "Confirmar"}
                  </button>
                  <button
                    type="button"
                    onClick={onCancelar}
                    disabled={guardando}
                    className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
