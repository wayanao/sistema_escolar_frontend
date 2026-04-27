import React from 'react';

const FacturaModerna = React.forwardRef(({ pago, estudiante, empresa }, ref) => {
  if (!pago || !estudiante) return null;

  // Datos por defecto si no se pasan
  const dataEmpresa = empresa || {
    nombre: "Mi Empresa Educativa",
    direccion: "Av. Principal 123, Ciudad",
    telefono: "+1 234 567 890",
    correo: "contacto@miempresa.com",
    logoText: "LOGO" // Puedes reemplazar esto por un <img /> real
  };

  // Convertir monto a número y formatear factura
  const numeroFactura = pago.pago_id ? pago.pago_id.toString().padStart(6, '0') : "000000";
  const total = Number(pago.monto) || 0;

  return (
    <div ref={ref} className="bg-[#fdf0f3] p-8 max-w-4xl mx-auto shadow-lg border border-rose-200 rounded-xl font-sans text-gray-800 relative z-0">
      
      {/* FONDO DE MARCA DE AGUA (ÚTILES ESCOLARES PASTEL) - DIV CON BACKGROUND PARA QUE SE REPITA SIN PIXELAR */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          zIndex: -1, 
          opacity: 0.18,
          backgroundImage: "url('https://img.freepik.com/free-vector/hand-drawn-back-school-pattern_23-2149464866.jpg')",
          backgroundSize: "200px",
          backgroundRepeat: "repeat",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact"
        }}
      ></div>

      {/* 1. Encabezado */}
      <div className="relative flex flex-col md:flex-row justify-between items-start border-b border-gray-200 pb-8 mb-8">
        <div className="flex items-center gap-5 mb-6 md:mb-0">
          {/* Logo Placeholder estilo SaaS */}
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            {dataEmpresa.logoText}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{dataEmpresa.nombre}</h2>
            <p className="text-sm text-gray-500 mt-1">{dataEmpresa.direccion}</p>
            <p className="text-sm text-gray-500">{dataEmpresa.telefono} • {dataEmpresa.correo}</p>
          </div>
        </div>
        <div className="text-left md:text-right">
          <h1 className="text-4xl font-extrabold text-rose-500 tracking-widest uppercase">Factura</h1>
          <div className="mt-3">
            <p className="text-sm text-gray-500 mb-1">Nº FACTURA: <span className="font-semibold text-gray-800">FAC-{numeroFactura}</span></p>
            <p className="text-sm text-gray-500">FECHA EMISIÓN: <span className="font-semibold text-gray-800">{pago.fecha || new Date().toLocaleDateString()}</span></p>
          </div>
        </div>
      </div>

      {/* 2. Información del cliente */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-rose-50 rounded-xl transform -skew-y-1"></div>
        <div className="relative bg-rose-50 rounded-xl p-6 border border-rose-100/50">
          <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-4">Facturar a:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xl font-bold text-gray-800 mb-1">{estudiante.nombre} {estudiante.apellido}</p>
              <p className="text-sm text-gray-600"><span className="text-gray-400">Documento:</span> {estudiante.documento || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600"><span className="text-gray-400">Dirección:</span> {estudiante.direccion || 'No registrada'}</p>
              <p className="text-sm text-gray-600 mt-1"><span className="text-gray-400">Teléfono:</span> {estudiante.telefono || 'No registrado'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tabla de productos / Detalles del pago */}
      <div className="relative mb-10 overflow-hidden rounded-xl border border-gray-200 bg-white/80">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-rose-50 text-rose-700 text-xs uppercase tracking-wider">
              <th className="py-4 px-6 font-bold">Descripción del Concepto</th>
              <th className="py-4 px-6 font-bold text-center w-24">Cant.</th>
              <th className="py-4 px-6 font-bold text-right w-36">Precio Unit.</th>
              <th className="py-4 px-6 font-bold text-right w-40">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rose-100">
            {/* Solo tenemos un item en base al pago actual, pero si fueran varios se iterarían */}
            <tr className="bg-white hover:bg-rose-50/50 transition-colors">
              <td className="py-5 px-6">
                <p className="font-semibold text-gray-800">{pago.descripcion || 'Pago de mensualidad/servicio'}</p>
              </td>
              <td className="py-5 px-6 text-center text-gray-600 font-medium">1</td>
              <td className="py-5 px-6 text-right text-gray-600 font-medium">${total.toLocaleString('es-CO')}</td>
              <td className="py-5 px-6 text-right font-bold text-gray-900">${total.toLocaleString('es-CO')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 5. Resumen */}
      <div className="relative flex justify-end mb-10">
        <div className="w-full md:w-1/2 lg:w-1/3 bg-white/90 rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 font-medium text-sm uppercase tracking-wide">Subtotal</span>
            <span className="text-gray-800 font-semibold">${total.toLocaleString('es-CO')}</span>
          </div>
          {/* Se solicitó NO incluir IVA ni impuestos */}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-rose-200">
            <span className="text-lg font-bold text-gray-800">Total a Pagar</span>
            <span className="text-3xl font-black text-rose-600">${total.toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>

      {/* 6. Pie de página */}
      <div className="relative border-t border-gray-200 pt-8 mt-4">
        <div className="flex flex-col items-center">
          <p className="text-gray-600 font-medium text-lg tracking-wide mb-1">¡Gracias por confiar en {dataEmpresa.nombre}!</p>
          <p className="text-sm text-gray-400">Este documento es un comprobante de pago oficial generado electrónicamente.</p>
        </div>
      </div>
    </div>
  );
});

FacturaModerna.displayName = 'FacturaModerna';

export default FacturaModerna;