import { Link } from "react-router-dom";
import auligoLogoNav from "../../assets/auligo-logo-nav.png";

// Menú fijo de la landing: una cápsula de vidrio oscuro que se lee igual sobre
// la portada morada y sobre las secciones claras.
function NavLanding({ secciones, rutaIngreso }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Navegación de la página"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#12081f]/85 px-4 py-2.5 shadow-[0_12px_40px_rgba(10,4,25,0.35)] backdrop-blur-xl sm:px-5"
      >
        <a href="#inicio" className="shrink-0" aria-label="Auligo, ir al inicio">
          <img src={auligoLogoNav} alt="Auligo" className="h-8 w-auto object-contain sm:h-9" />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {secciones.map((seccion) => (
            <li key={seccion.id}>
              <a
                href={`#${seccion.id}`}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-purple-100/80 transition hover:bg-white/10 hover:text-white"
              >
                {seccion.etiqueta}
              </a>
            </li>
          ))}
        </ul>

        <Link
          to={rutaIngreso}
          className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(190,242,100,0.35)] transition hover:-translate-y-0.5 hover:bg-lime-200"
        >
          Ingresar
        </Link>
      </nav>
    </header>
  );
}

export default NavLanding;
