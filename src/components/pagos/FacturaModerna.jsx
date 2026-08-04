import React from "react";

/**
 * Cuerpo de la factura/voucher de pago. Pensada para usarse DENTRO de
 * <DocumentoImprimible tipo="voucher_pago">, que aporta el encabezado
 * institucional (logo, nombre, eslogan) y el pie.
 */
const FacturaModerna = React.forwardRef(({ pago, estudiante }, ref) => {
  if (!pago || !estudiante) return null;

  const numeroFactura = pago.pago_id ? pago.pago_id.toString().padStart(6, "0") : "000000";
  const total = Number(pago.monto) || 0;
  const fecha = pago.fecha || new Date().toLocaleDateString();

  return (
    <div ref={ref} className="text-gray-800">
      <div className="flex flex-wrap justify-between items-start mb-6 pb-4 border-b border-slate-300">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Facturar a</p>
          <p className="text-lg font-bold mt-1">
            {estudiante.nombre} {estudiante.apellido}
          </p>
          <p className="text-sm text-slate-600">
            Documento: {estudiante.documento || "N/A"}
          </p>
          {estudiante.direccion && (
            <p className="text-sm text-slate-600">Dirección: {estudiante.direccion}</p>
          )}
          {estudiante.telefono && (
            <p className="text-sm text-slate-600">Teléfono: {estudiante.telefono}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 uppercase tracking-wider">N° Factura</p>
          <p className="font-bold">FAC-{numeroFactura}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider mt-2">Fecha</p>
          <p className="font-semibold">{fecha}</p>
        </div>
      </div>

      <table className="w-full text-left border-collapse mb-8">
        <thead>
          <tr className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wider">
            <th className="py-3 px-3 font-semibold">Descripción</th>
            <th className="py-3 px-3 font-semibold text-center w-20">Cant.</th>
            <th className="py-3 px-3 font-semibold text-right w-32">P. Unitario</th>
            <th className="py-3 px-3 font-semibold text-right w-36">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-3 px-3">{pago.descripcion || "Pago de mensualidad/servicio"}</td>
            <td className="py-3 px-3 text-center">1</td>
            <td className="py-3 px-3 text-right">${total.toLocaleString("es-CO")}</td>
            <td className="py-3 px-3 text-right font-bold">${total.toLocaleString("es-CO")}</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-full md:w-1/2 lg:w-1/3 border border-slate-300 rounded p-4">
          <div className="flex justify-between mb-2">
            <span className="text-slate-600 text-sm uppercase">Subtotal</span>
            <span className="font-semibold">${total.toLocaleString("es-CO")}</span>
          </div>
          <div className="flex justify-between pt-2 mt-2 border-t border-slate-300">
            <span className="font-bold uppercase">Total a Pagar</span>
            <span className="text-2xl font-black">${total.toLocaleString("es-CO")}</span>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-8">
        Este documento es un comprobante de pago oficial generado electrónicamente.
      </p>
    </div>
  );
});

FacturaModerna.displayName = "FacturaModerna";

export default FacturaModerna;
