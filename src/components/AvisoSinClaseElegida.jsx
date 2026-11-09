/**
 * Lo que se ve donde iría el contenido de la pantalla mientras no hay una
 * clase con la que trabajar: cargando, sin elegir, o por qué no se puede.
 * Reemplaza la alerta que antes devolvía al profesor al panel.
 */
function AvisoSinClaseElegida({ titulo, texto = "", cargando = false }) {
  return (
    <section
      role="status"
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-purple-200 bg-white px-5 py-10 text-center shadow-sm"
    >
      {cargando ? (
        <span
          className="h-8 w-8 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600"
          aria-hidden="true"
        ></span>
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-700" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <h2 className="text-lg font-bold text-gray-950">{titulo}</h2>
      {texto && <p className="max-w-xl text-base text-gray-600">{texto}</p>}
    </section>
  );
}

export default AvisoSinClaseElegida;
