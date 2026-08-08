import React from "react";
import { formatoMoneda } from "../../utils/reportesFinancieros/formatos";
import { MEDIOS_PAGO_INGRESO, montoVisibleIngreso, montoVisibleMetodoPago, obtenerMediosPago } from "../../utils/reportesFinancieros/mediosPago";

const DetalleReportes = React.forwardRef(
  (
    {
      detalleTipo,
      detalleTitulo,
      loadingDetalle,
      filtroMedioIngreso,
      onCambiarFiltroMedioIngreso,
      onCerrar,
      detalleEgresos,
      detalleIngresosFiltrados,
      totalDetalleIngresos,
      totalDetalleEgresos,
    },
    ref
  ) => (
    <div
      ref={ref}
      className={`scroll-mt-6 rounded-lg border bg-white p-5 shadow-sm ${detalleTipo === "egresos" ? "border-red-200" : "border-green-200"}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {detalleTipo === "egresos" ? "Detalle de egresos" : "Detalle de ingresos"}
          </h2>
          <p className="text-sm text-gray-600">{detalleTitulo}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {detalleTipo === "ingresos" && (
            <select
              value={filtroMedioIngreso}
              onChange={(event) => onCambiarFiltroMedioIngreso(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="Filtrar por medio de pago"
            >
              {MEDIOS_PAGO_INGRESO.map((medio) => (
                <option key={medio.value} value={medio.value}>
                  {medio.label}
                </option>
              ))}
            </select>
          )}
          <span className={`rounded-lg px-3 py-2 text-sm font-bold ${detalleTipo === "egresos" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {formatoMoneda(detalleTipo === "egresos" ? totalDetalleEgresos : totalDetalleIngresos)}
          </span>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>

      {loadingDetalle ? (
        <div className="py-8 text-center text-sm text-gray-500">Cargando detalle...</div>
      ) : detalleTipo === "egresos" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Concepto</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Origen</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {detalleEgresos.map((egreso) => (
                <tr key={egreso.id} className="hover:bg-red-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{egreso.fecha}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    <div>{egreso.concepto}</div>
                    {egreso.notas && <div className="mt-1 text-xs font-normal text-gray-500">{egreso.notas}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{egreso.categoria}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-600">{egreso.origen}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-red-700">
                    {formatoMoneda(egreso.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {detalleEgresos.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No hay egresos en este rango.</p>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Estudiante</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Medio de pago</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase text-gray-500">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {detalleIngresosFiltrados.map((pago) => (
                <tr key={pago.id} className={pago.anulado ? "bg-red-50 hover:bg-red-100" : "hover:bg-green-50"}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{pago.fecha}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{pago.estudiante}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div>{pago.descripcion}</div>
                    {pago.anulado && pago.motivo_anulacion && (
                      <div className="mt-1 text-xs text-red-700">Motivo: {pago.motivo_anulacion}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {obtenerMediosPago(pago).map((medio, index) => {
                        const montoMetodo = montoVisibleMetodoPago(pago, medio, filtroMedioIngreso);
                        return (
                          <span
                            key={`${medio.tipo}-${index}`}
                            className="rounded-full bg-blue-100 px-2 py-1 font-bold text-blue-700"
                          >
                            {medio.tipo}
                            {montoMetodo !== null ? ` ${formatoMoneda(montoMetodo)}` : ""}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`rounded-full px-2 py-1 font-bold ${pago.anulado ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {pago.anulado ? "Anulado" : "Pagado"}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-bold ${pago.anulado ? "text-red-600 line-through" : "text-green-700"}`}>
                    {formatoMoneda(montoVisibleIngreso(pago, filtroMedioIngreso))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {detalleIngresosFiltrados.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No hay ingresos para el medio de pago seleccionado.</p>}
        </div>
      )}
    </div>
  )
);

DetalleReportes.displayName = "DetalleReportes";

export default DetalleReportes;
