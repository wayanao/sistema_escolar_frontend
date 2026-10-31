import CampoPesos from "../CampoPesos";
import { METODOS_PAGO } from "../../utils/pagos/contratos";
import {
  formatearMoneda,
  formatearNombreMes,
  formatearPeriodo,
} from "../../utils/pagos/formatos";

export default function FormularioPago({
  pagoData,
  modoPago,
  abonoLibre,
  registrandoPago,
  ventasPendientes,
  deudasEstudiante,
  deudaPendienteSeleccionada,
  opcionVencidaSeleccionada,
  periodosVencidosSeleccionados,
  todasLasCuotasSeleccionadas,
  loadingOpcionesVencidas,
  errorOpcionesVencidas,
  opcionesAdelanto,
  loadingOpcionesAdelanto,
  errorOpcionesAdelanto,
  opcionAdelantoSeleccionada,
  deudaDelConceptoAdelantado,
  periodosAdelantoSeleccionados,
  saldoAdelantoSinDistribuir,
  onRegistrar,
  onCerrar,
  onCambiarModoPago,
  onSeleccionarConceptoPendiente,
  onActualizarCuotasSeleccionadas,
  onActivarAbonoLibre,
  onReintentarOpcionesVencidas,
  onSeleccionarConceptoAdelanto,
  onCambiarCantidadAdelanto,
  onCambiarModalidadAdelanto,
  onCambiarMontoDistribuir,
  onReintentarOpcionesAdelanto,
  onActualizarCampoPago,
  onCambiarMontoPago,
  onValidarMonto,
  onAlternarMetodoPago,
  onCambiarMontoMetodo,
  onCambiarNotaMetodo,
}) {
  return (
    <form onSubmit={onRegistrar} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
      <div
        className="mb-5 grid grid-cols-2 rounded-xl border border-gray-200 bg-white p-1"
        role="group"
        aria-label="Tipo de registro de pago"
      >
        <button
          type="button"
          onClick={() => onCambiarModoPago("normal")}
          className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
            modoPago === "normal"
              ? "bg-purple-700 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Pago pendiente
        </button>
        <button
          type="button"
          onClick={() => onCambiarModoPago("adelantado")}
          className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
            modoPago === "adelantado"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Meses adelantados
        </button>
      </div>

      {modoPago === "normal" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Concepto de Pago</label>
          <select
            aria-label="Concepto de Pago"
            value={pagoData.venta_id ? `CargoVenta_${pagoData.venta_id}` : pagoData.descripcion}
            onChange={(event) => onSeleccionarConceptoPendiente(event.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            required
          >
            <option value="">-- Seleccione un Concepto --</option>

            {ventasPendientes.length > 0 && (
              <optgroup label="Cargos de Inventario (Pendientes)">
                {ventasPendientes.map((ventaPendiente) => (
                  <option
                    key={`venta_${ventaPendiente.id}`}
                    value={`CargoVenta_${ventaPendiente.id}`}
                  >
                    {ventaPendiente.descripcion} (${ventaPendiente.total.toLocaleString()})
                  </option>
                ))}
              </optgroup>
            )}

            <optgroup label="Pensiones, Matrícula y Colegiatura">
              {deudasEstudiante.length > 0 ? deudasEstudiante.map((deuda, index) => (
                <option key={`deuda_${index}`} value={deuda.concepto}>
                  {deuda.concepto} (${deuda.deuda.toLocaleString()}) {deuda.pagado > 0 ? "- Saldo" : ""}
                </option>
              )) : (
                <option disabled>No hay deudas pendientes</option>
              )}
            </optgroup>
          </select>

          {deudaPendienteSeleccionada?.tipo_cobro === "mensual" && (
            <section className="mt-4 overflow-hidden rounded-xl border border-purple-200 bg-purple-50/60">
              <div className="flex flex-col gap-3 border-b border-purple-100 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-purple-950">Meses pendientes</h3>
                    {opcionVencidaSeleccionada?.cuotas?.length > 0 && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                        {opcionVencidaSeleccionada.cuotas.length}{" "}
                        {opcionVencidaSeleccionada.cuotas.length === 1 ? "mes" : "meses"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    El mes más antiguo se selecciona primero. Puedes elegir varios.
                  </p>
                </div>
                {opcionVencidaSeleccionada?.cuotas?.length > 0 && !abonoLibre && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onActualizarCuotasSeleccionadas(
                        opcionVencidaSeleccionada,
                        [opcionVencidaSeleccionada.cuotas[0].periodo]
                      )}
                      className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50"
                    >
                      Más antiguo
                    </button>
                    <button
                      type="button"
                      onClick={() => onActualizarCuotasSeleccionadas(
                        opcionVencidaSeleccionada,
                        todasLasCuotasSeleccionadas
                          ? [opcionVencidaSeleccionada.cuotas[0].periodo]
                          : opcionVencidaSeleccionada.cuotas.map((cuota) => cuota.periodo)
                      )}
                      className="rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50"
                    >
                      {todasLasCuotasSeleccionadas ? "Solo el más antiguo" : "Seleccionar todos"}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4">
                {loadingOpcionesVencidas ? (
                  <div className="flex items-center gap-2 rounded-lg bg-white p-3 text-sm font-medium text-purple-800">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600"
                      aria-hidden="true"
                    />
                    Consultando cuotas vencidas...
                  </div>
                ) : errorOpcionesVencidas ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <p>{errorOpcionesVencidas}</p>
                    <button
                      type="button"
                      onClick={onReintentarOpcionesVencidas}
                      className="mt-2 font-bold underline"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : abonoLibre ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm font-semibold text-amber-900">
                      Abono libre sin asignación mensual
                    </p>
                    <p className="mt-1 text-xs text-amber-800">
                      El monto seguirá siendo editable y se aplicará con la regla anterior.
                    </p>
                    {opcionVencidaSeleccionada?.cuotas?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onActualizarCuotasSeleccionadas(
                          opcionVencidaSeleccionada,
                          [opcionVencidaSeleccionada.cuotas[0].periodo]
                        )}
                        className="mt-2 text-sm font-bold text-purple-700 underline"
                      >
                        Volver a seleccionar meses
                      </button>
                    )}
                  </div>
                ) : opcionVencidaSeleccionada?.cuotas?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {opcionVencidaSeleccionada.cuotas.map((cuota) => {
                      const seleccionada = periodosVencidosSeleccionados.has(cuota.periodo);
                      return (
                        <label
                          key={cuota.periodo}
                          className={`cursor-pointer rounded-xl border p-3 transition ${
                            seleccionada
                              ? "border-purple-500 bg-purple-100 shadow-sm ring-1 ring-purple-300"
                              : "border-gray-200 bg-white hover:border-purple-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={seleccionada}
                              onChange={() => {
                                const siguientes = new Set(periodosVencidosSeleccionados);
                                if (seleccionada) siguientes.delete(cuota.periodo);
                                else siguientes.add(cuota.periodo);
                                if (siguientes.size === 0) return;
                                onActualizarCuotasSeleccionadas(
                                  opcionVencidaSeleccionada,
                                  [...siguientes]
                                );
                              }}
                              className="mt-1 h-4 w-4 accent-purple-700"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-bold text-gray-900">
                                  {formatearPeriodo(cuota.periodo)}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                  cuota.estado === "parcial"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-700"
                                }`}>
                                  {cuota.estado === "parcial" ? "Saldo pendiente" : "Vencido"}
                                </span>
                              </span>
                              <span className="mt-2 flex items-end justify-between gap-2 text-sm">
                                <span className="text-gray-500">Saldo de la cuota</span>
                                <strong className="text-gray-900">
                                  {formatearMoneda(cuota.saldo)}
                                </strong>
                              </span>
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-600">
                    No hay meses vencidos disponibles para este concepto.
                  </p>
                )}

                {!abonoLibre && opcionVencidaSeleccionada?.cuotas?.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2 rounded-lg bg-purple-900 p-3 text-white sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm">
                      {pagoData.aplicaciones.length}{" "}
                      {pagoData.aplicaciones.length === 1 ? "mes seleccionado" : "meses seleccionados"}
                    </span>
                    <strong className="text-lg">Total: {formatearMoneda(pagoData.monto)}</strong>
                  </div>
                )}

                {!abonoLibre && (
                  <button
                    type="button"
                    onClick={onActivarAbonoLibre}
                    className="mt-3 text-xs font-semibold text-gray-600 underline hover:text-purple-700"
                  >
                    Registrar un abono libre sin seleccionar mes
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      ) : (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="mb-3">
            <h3 className="font-bold text-emerald-950">Registrar mensualidades futuras</h3>
            <p className="mt-1 text-sm text-emerald-800">
              El sistema selecciona los próximos meses disponibles y evita cobrarlos dos veces.
            </p>
          </div>

          {loadingOpcionesAdelanto ? (
            <p className="text-sm font-medium text-emerald-800">Consultando meses disponibles...</p>
          ) : errorOpcionesAdelanto ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <p>{errorOpcionesAdelanto}</p>
              <button
                type="button"
                onClick={onReintentarOpcionesAdelanto}
                className="mt-2 font-bold underline"
              >
                Reintentar
              </button>
            </div>
          ) : opcionesAdelanto.length === 0 ? (
            <p className="rounded-lg border border-dashed border-emerald-300 bg-white p-3 text-sm text-gray-600">
              No hay conceptos mensuales habilitados para adelantar.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Concepto mensual
                </label>
                <select
                  value={pagoData.tipo_pago_id_adelanto}
                  onChange={(event) => onSeleccionarConceptoAdelanto(event.target.value)}
                  className="w-full rounded-lg border border-emerald-200 bg-white p-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  required
                >
                  <option value="">-- Selecciona un concepto --</option>
                  {opcionesAdelanto.map((opcion) => (
                    <option
                      key={opcion.tipo_pago_id}
                      value={opcion.tipo_pago_id}
                      disabled={opcion.max_meses === 0}
                    >
                      {opcion.concepto} · {formatearMoneda(opcion.valor_unitario)} por mes
                      {opcion.max_meses === 0 ? " · Sin meses disponibles" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {opcionAdelantoSeleccionada && opcionAdelantoSeleccionada.max_meses > 0 && (
                <>
                  <div
                    className="grid grid-cols-2 rounded-xl border border-emerald-200 bg-white p-1"
                    role="group"
                    aria-label="Forma de calcular el adelanto"
                  >
                    <button
                      type="button"
                      onClick={() => onCambiarModalidadAdelanto("meses")}
                      className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                        pagoData.modalidad_adelanto === "meses"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-emerald-50"
                      }`}
                    >
                      Meses completos
                    </button>
                    <button
                      type="button"
                      onClick={() => onCambiarModalidadAdelanto("monto")}
                      className={`rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                        pagoData.modalidad_adelanto === "monto"
                          ? "bg-amber-500 text-amber-950 shadow-sm"
                          : "text-gray-600 hover:bg-amber-50"
                      }`}
                    >
                      Distribuir un monto
                    </button>
                  </div>

                  {Number(deudaDelConceptoAdelantado?.deuda || 0) > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      <strong>
                        Hay deuda vencida por {formatearMoneda(deudaDelConceptoAdelantado.deuda)}.
                      </strong>
                      <span className="mt-1 block">
                        Este adelanto se aplicará a meses futuros y no cancelará esa deuda.
                      </span>
                    </div>
                  )}

                  {pagoData.modalidad_adelanto === "meses" ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Cantidad de meses
                        </label>
                        <select
                          value={pagoData.cantidad_meses}
                          onChange={(event) => onCambiarCantidadAdelanto(event.target.value)}
                          className="w-full rounded-lg border border-emerald-200 bg-white p-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        >
                          {Array.from(
                            { length: opcionAdelantoSeleccionada.max_meses },
                            (_, index) => index + 1
                          ).map((cantidad) => (
                            <option key={cantidad} value={cantidad}>
                              {cantidad} {cantidad === 1 ? "mes" : "meses"}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="rounded-lg border border-emerald-200 bg-white p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Total del adelanto
                        </p>
                        <p className="mt-1 text-xl font-black text-emerald-950">
                          {formatearMoneda(pagoData.monto)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">
                          Monto recibido o subsidio
                        </label>
                        <CampoPesos
                          min={1}
                          max={opcionAdelantoSeleccionada.total_disponible}
                          valor={pagoData.monto_distribuir}
                          onCambiar={onCambiarMontoDistribuir}
                          className={`w-full rounded-lg border bg-white p-2.5 focus:ring-2 ${
                            saldoAdelantoSinDistribuir > 0
                              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                              : "border-amber-300 focus:border-amber-500 focus:ring-amber-200"
                          }`}
                          placeholder="Ej: 80.000"
                        />
                        <p className="mt-1 text-xs text-gray-600">
                          Disponible hasta {formatearNombreMes(opcionAdelantoSeleccionada.mes_final)}:{" "}
                          {formatearMoneda(opcionAdelantoSeleccionada.total_disponible)}
                        </p>
                      </div>
                      <div className={`rounded-lg border p-3 ${
                        saldoAdelantoSinDistribuir > 0
                          ? "border-red-200 bg-red-50"
                          : "border-amber-200 bg-white"
                      }`}>
                        <p className={`text-xs font-bold uppercase tracking-wide ${
                          saldoAdelantoSinDistribuir > 0 ? "text-red-700" : "text-amber-700"
                        }`}>
                          {saldoAdelantoSinDistribuir > 0 ? "Monto sin asignar" : "Monto a distribuir"}
                        </p>
                        <p className={`mt-1 text-xl font-black ${
                          saldoAdelantoSinDistribuir > 0 ? "text-red-900" : "text-amber-950"
                        }`}>
                          {formatearMoneda(
                            saldoAdelantoSinDistribuir > 0
                              ? saldoAdelantoSinDistribuir
                              : pagoData.monto
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                      {pagoData.modalidad_adelanto === "monto"
                        ? "Distribución prevista"
                        : "Meses que quedarán cubiertos"}
                    </p>
                    {periodosAdelantoSeleccionados.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {periodosAdelantoSeleccionados.map((periodo) => (
                          <div
                            key={periodo.periodo}
                            className="rounded-lg border border-emerald-200 bg-white p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <strong className="text-emerald-950">{periodo.etiqueta}</strong>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                periodo.saldo_restante > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {periodo.saldo_restante > 0 ? "Saldo pendiente" : "Queda cubierto"}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-sm">
                              <span className="text-gray-500">Se aplicará</span>
                              <strong>{formatearMoneda(periodo.monto_aplicado)}</strong>
                            </div>
                            {periodo.saldo_restante > 0 && (
                              <div className="mt-1 flex items-center justify-between text-xs text-amber-800">
                                <span>Saldo para completar</span>
                                <strong>{formatearMoneda(periodo.saldo_restante)}</strong>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-lg border border-dashed border-emerald-300 bg-white p-3 text-sm text-gray-600">
                        Escribe el monto para ver cómo se distribuirá.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            value={pagoData.fecha}
            onChange={(event) => onActualizarCampoPago("fecha", event.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {modoPago === "adelantado" || pagoData.aplicaciones.length > 0
              ? "Total calculado ($)"
              : "Monto ($)"}
          </label>
          <CampoPesos
            valor={pagoData.monto}
            onCambiar={onCambiarMontoPago}
            // El campo muestra "150.000": se valida el valor del estado, no el texto.
            onBlur={() => {
              if (modoPago === "normal" && pagoData.monto) {
                onValidarMonto(Number(pagoData.monto));
              }
            }}
            readOnly={modoPago === "adelantado" || pagoData.aplicaciones.length > 0}
            className={`w-full rounded-lg border p-2 focus:border-transparent focus:ring-2 ${
              modoPago === "adelantado"
                ? "border-emerald-200 bg-emerald-50 font-bold text-emerald-950 focus:ring-emerald-300"
                : pagoData.aplicaciones.length > 0
                  ? "border-purple-200 bg-purple-50 font-bold text-purple-950 focus:ring-purple-300"
                  : "border-gray-300 bg-white focus:ring-purple-500"
            }`}
            required
            placeholder="Ej: 150.000"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Métodos de Pago (puede elegir varios)
        </label>
        <div className="flex flex-col gap-2">
          {METODOS_PAGO.map((tipo) => {
            const indice = pagoData.metodos.findIndex((metodo) => metodo.tipo === tipo);
            const seleccionado = indice !== -1;
            return (
              <div key={tipo} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`metodo-${tipo}`}
                  checked={seleccionado}
                  onChange={(event) => onAlternarMetodoPago(tipo, event.target.checked)}
                />
                <label htmlFor={`metodo-${tipo}`} className="capitalize w-24">{tipo}</label>
                {seleccionado && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <CampoPesos
                      min={0}
                      placeholder="Monto"
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white w-32"
                      valor={pagoData.metodos[indice]?.monto || ""}
                      onCambiar={(monto) => onCambiarMontoMetodo(tipo, monto)}
                      required
                    />
                    {(tipo === "transferencia" || tipo === "subsidio") && (
                      <input
                        type="text"
                        placeholder={
                          tipo === "subsidio"
                            ? "Escribe la referencia del subsidio"
                            : "Banco o plataforma"
                        }
                        aria-label={
                          tipo === "subsidio"
                            ? "Referencia del subsidio"
                            : "Banco o plataforma"
                        }
                        className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white w-full sm:w-56"
                        value={pagoData.metodos[indice]?.nota || ""}
                        onChange={(event) => onCambiarNotaMetodo(tipo, event.target.value)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={
            registrandoPago ||
            (modoPago === "adelantado" && (
              loadingOpcionesAdelanto ||
              !pagoData.tipo_pago_id_adelanto ||
              (pagoData.modalidad_adelanto === "monto"
                ? Number(pagoData.monto_distribuir) <= 0 || saldoAdelantoSinDistribuir > 0
                : Number(pagoData.cantidad_meses) < 1)
            ))
          }
          className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300"
        >
          {registrandoPago && (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          )}
          {registrandoPago
            ? "Registrando..."
            : modoPago === "adelantado"
              ? "Registrar adelanto"
              : "Registrar Pago"}
        </button>
        <button
          type="button"
          onClick={onCerrar}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
