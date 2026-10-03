// La cajita para elegir el año, en la barra del admin. Solo presentación:
// quien decide si aparece y qué hace al cambiar es `useAnioLectivoEnPantalla`.
function SelectorAnioLectivoView({ opciones, anioSeleccionadoId, onCambiar }) {
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-white">
      <span className="hidden sm:inline">Año</span>
      <select
        aria-label="Año lectivo"
        value={anioSeleccionadoId ?? ""}
        onChange={(event) => onCambiar(Number(event.target.value))}
        className="rounded-md border border-white/40 bg-purple-800 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/70"
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}

export default SelectorAnioLectivoView;
