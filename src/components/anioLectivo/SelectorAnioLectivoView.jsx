// La cajita para elegir el año, en la barra del admin. Solo presentación:
// quien decide si aparece y qué hace al cambiar es `useAnioLectivoEnPantalla`.
//
// `tono` es el de la barra donde va: la morada de antes, la oscura del menú
// en celular o la blanca desde tablet.
const TONOS_SELECTOR = {
  morado: {
    etiqueta: "text-white",
    select: "border-white/40 bg-purple-800 text-white focus:ring-white/70",
  },
  oscuro: {
    etiqueta: "text-white",
    select: "border-white/25 bg-[#36195f] text-white focus:ring-white/70",
  },
  claro: {
    etiqueta: "text-slate-600",
    select: "border-slate-200 bg-white font-semibold text-slate-900 focus:ring-purple-300",
  },
};

function SelectorAnioLectivoView({ opciones, anioSeleccionadoId, onCambiar, tono = "morado" }) {
  const estilo = TONOS_SELECTOR[tono] ?? TONOS_SELECTOR.morado;

  return (
    <label className={`flex shrink-0 items-center gap-2 text-sm font-medium ${estilo.etiqueta}`}>
      <span className="hidden sm:inline">Año</span>
      <select
        aria-label="Año lectivo"
        value={anioSeleccionadoId ?? ""}
        onChange={(event) => onCambiar(Number(event.target.value))}
        className={`rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 ${estilo.select}`}
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
