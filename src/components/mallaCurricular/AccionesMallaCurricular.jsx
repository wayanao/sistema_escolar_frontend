export default function AccionesMallaCurricular({
  cargando,
  estadoVisual,
  guardando,
  onGuardar,
  onImprimir,
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 no-print sm:mt-8 sm:flex-row sm:gap-4">
      <button
        onClick={onGuardar}
        disabled={guardando || cargando}
        className="flex-1 bg-purple-600 hover:bg-purple-800 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition duration-200 transform hover:scale-105 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-purple-300 disabled:hover:scale-100"
      >
        <span className="flex items-center justify-center">
          {guardando ? (
            <span
              className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
          ) : (
            <span className="mr-2">💾</span>
          )}
          {guardando ? "Guardando..." : estadoVisual.buttonText}
        </span>
      </button>
      <button
        onClick={onImprimir}
        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition duration-200 transform hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        <span className="flex items-center justify-center">
          <span className="mr-2">🖨️</span>
          Imprimir Período
        </span>
      </button>
    </div>
  );
}
