import { Link } from "react-router-dom";
import FondoMarca from "../FondoMarca";
import IconoLanding from "./IconoLanding";
import VentanaProducto from "./VentanaProducto";

function PortadaLanding({ portada, planilla, rutaIngreso }) {
  return (
    <section
      id="inicio"
      className="relative isolate overflow-hidden bg-slate-950 pb-24 pt-32 text-white sm:pt-36 lg:pb-32 lg:pt-44"
    >
      <FondoMarca animado />

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-purple-50 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.85)]" />
            {portada.insignia}
          </div>

          <h1 className="mt-7 text-[2.65rem] font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-[3.25rem] xl:text-[3.6rem]">
            {portada.titulo}{" "}
            <span className="block bg-gradient-to-r from-lime-200 via-lime-300 to-purple-200 bg-clip-text pb-1 text-transparent">
              {portada.tituloResaltado}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-purple-100/85">{portada.texto}</p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to={rutaIngreso}
              className="group inline-flex items-center gap-2 rounded-xl bg-lime-300 px-6 py-3.5 text-base font-bold text-slate-950 shadow-[0_0_44px_rgba(190,242,100,0.35)] transition hover:-translate-y-0.5 hover:bg-lime-200"
            >
              Ingresar
              <IconoLanding
                nombre="flecha"
                className="h-5 w-5 transition group-hover:translate-x-0.5"
              />
            </Link>
            <a
              href="#un-dia"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Ver cómo funciona
            </a>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-purple-100/80">
            {portada.garantias.map((garantia) => (
              <li key={garantia} className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-300/15 text-lime-300">
                  <IconoLanding nombre="check" className="h-3.5 w-3.5" />
                </span>
                {garantia}
              </li>
            ))}
          </ul>
        </div>

        <VentanaProducto planilla={planilla} />
      </div>
    </section>
  );
}

export default PortadaLanding;
