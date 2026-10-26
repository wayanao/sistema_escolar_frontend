import auligoLogoNav from "../../assets/auligo-logo-nav.png";

function PieLanding({ secciones, anio }) {
  return (
    <footer className="bg-slate-950 text-purple-100/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <img src={auligoLogoNav} alt="Auligo" className="h-9 w-auto object-contain" />
          <p className="mt-3 text-sm">Gestión escolar en un solo lugar.</p>
        </div>

        <nav aria-label="Secciones de la página">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            {secciones.map((seccion) => (
              <li key={seccion.id}>
                <a href={`#${seccion.id}`} className="transition hover:text-white">
                  {seccion.etiqueta}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-5 py-6 text-xs sm:px-8">© {anio} Auligo.</p>
      </div>
    </footer>
  );
}

export default PieLanding;
