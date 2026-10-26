// Cinta que desliza los nombres de los módulos. La lista va dos veces seguidas
// para que el movimiento no tenga corte; la copia se oculta a los lectores de
// pantalla para que no la lean dos veces.
function CintaModulos({ modulos }) {
  const repetidos = [...modulos, ...modulos];

  return (
    <section
      aria-label="Módulos de Auligo"
      className="relative overflow-hidden border-y border-white/10 bg-[#13092a] py-5"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#13092a] to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#13092a] to-transparent sm:w-32" />

      <ul className="landing-cinta flex w-max items-center">
        {repetidos.map((modulo, indice) => (
          <li
            key={`${modulo}-${indice}`}
            aria-hidden={indice >= modulos.length ? "true" : undefined}
            className="flex items-center whitespace-nowrap text-base font-bold text-purple-100/75 sm:text-lg"
          >
            <span className="px-6 sm:px-8">{modulo}</span>
            <span aria-hidden="true" className="text-lime-300">
              ✦
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CintaModulos;
