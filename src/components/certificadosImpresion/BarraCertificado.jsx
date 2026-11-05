// Va arriba de la hoja, dentro de la página. Antes el botón "Atrás" era fijo
// en la esquina de la pantalla y quedaba encima del menú lateral (computador)
// y de la barra de arriba (celular). El ancho es el del papel carta, para que
// la barra empiece donde empieza la hoja. A la derecha van las opciones de
// impresión que no salen en el papel (`children`).
export default function BarraCertificado({ onBack, children }) {
  return (
    <div className="no-print mx-auto flex w-full max-w-[215.9mm] flex-wrap items-end gap-3">
      <button
        type="button"
        onClick={onBack}
        className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
        title="Atrás"
      >
        ← Atrás
      </button>
      {children}
    </div>
  );
}
