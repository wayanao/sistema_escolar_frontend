import { etiquetaTipoCobro } from "../../utils/anioLectivo";
import { formatMoney } from "../../utils/carteraTiposPago/formatos";

const claseCampo =
  "mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200";

const claseBoton =
  "w-full rounded-lg px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto";

// "Valores de pago" al matricular: lo que se le cobra a un estudiante en el
// año en preparación, concepto por concepto, con el precio de su curso y su
// valor personalizado. Solo presenta lo que llega del backend.
export default function ValoresPagoMatriculaView({
  anio,
  estudianteNombre,
  filas,
  borradores,
  cargando,
  guardandoTipoId,
  mensaje,
  error,
  onCambiarBorrador,
  onGuardar,
  onVolverAlPrecio,
  onCerrar,
}) {
  const ocupado = guardandoTipoId !== null;

  return (
    <section
      aria-label={`Valores de pago de ${estudianteNombre}`}
      className="rounded-lg border border-purple-200 bg-purple-50/40 p-3 sm:p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900">
            Valores de pago de {estudianteNombre}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Lo que se le cobrará en {anio}. Escribe un valor solo si este estudiante paga
            distinto al precio de su curso.
          </p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar valores de pago"
          className={`${claseBoton} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
        >
          Cerrar
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {mensaje && (
        <div role="status" className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          {mensaje}
        </div>
      )}

      {cargando && <p className="mt-3 text-sm text-gray-600">Cargando valores de pago...</p>}

      {!cargando && filas.length === 0 && (
        <p className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-600">
          No hay conceptos que se le cobren en {anio}. Revisa en Tipos de Pago que estén
          activos y con precio en su curso.
        </p>
      )}

      {filas.length > 0 && (
        <ul className="mt-3 space-y-3">
          {filas.map((fila) => {
            const borrador = borradores[fila.tipoPagoId] ?? { valor: "", motivo: "" };
            const guardandoEste = guardandoTipoId === fila.tipoPagoId;
            return (
              <li
                key={fila.tipoPagoId}
                aria-label={fila.nombre}
                className="min-w-0 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{fila.nombre}</p>
                    <p className="text-xs text-gray-500">{etiquetaTipoCobro(fila.tipoCobro)}</p>
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className="text-gray-700">
                      Precio del curso: <strong>{formatMoney(fila.precioCurso)}</strong>
                    </p>
                    {fila.personalizado ? (
                      <p className="font-semibold text-purple-800">
                        {`Paga ${formatMoney(fila.valorAPagar)} (personalizado)`}
                      </p>
                    ) : (
                      <p className="text-gray-600">Paga el precio del curso</p>
                    )}
                    {fila.motivo && (
                      <p className="text-xs text-gray-500">Motivo: {fila.motivo}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_auto_auto] sm:items-end">
                  <label className="text-xs font-medium text-gray-700">
                    Valor para este estudiante
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={borrador.valor}
                      onChange={(event) =>
                        onCambiarBorrador(fila.tipoPagoId, "valor", event.target.value)
                      }
                      aria-label={`Valor personalizado de ${fila.nombre}`}
                      placeholder={String(fila.precioCurso)}
                      className={claseCampo}
                    />
                  </label>
                  <label className="text-xs font-medium text-gray-700">
                    Motivo
                    <input
                      type="text"
                      maxLength={250}
                      value={borrador.motivo}
                      onChange={(event) =>
                        onCambiarBorrador(fila.tipoPagoId, "motivo", event.target.value)
                      }
                      aria-label={`Motivo de ${fila.nombre}`}
                      placeholder="Ej.: beca, acuerdo con la familia"
                      className={claseCampo}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onGuardar(fila.tipoPagoId)}
                    disabled={ocupado || !String(borrador.valor).trim()}
                    aria-label={`Guardar el valor de ${fila.nombre}`}
                    className={`${claseBoton} bg-purple-700 text-white hover:bg-purple-800`}
                  >
                    {guardandoEste ? "Guardando..." : "Guardar"}
                  </button>
                  {fila.personalizado && (
                    <button
                      type="button"
                      onClick={() => onVolverAlPrecio(fila.tipoPagoId)}
                      disabled={ocupado}
                      aria-label={`Volver al precio del curso en ${fila.nombre}`}
                      className={`${claseBoton} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
                    >
                      Volver al precio del curso
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
