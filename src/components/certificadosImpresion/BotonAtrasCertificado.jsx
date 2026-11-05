// Va arriba de la hoja, dentro de la página. Antes era fijo en la esquina de
// la pantalla y quedaba encima del menú lateral (computador) y de la barra de
// arriba (celular). El ancho es el del papel carta, para que el botón empiece
// donde empieza la hoja.
export default function BotonAtrasCertificado({ onClick }) {
  return (
    <div className="no-print mx-auto w-full max-w-[215.9mm]">
      <button
        type="button"
        onClick={onClick}
        className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
        title="Atrás"
      >
        ← Atrás
      </button>
    </div>
  );
}
