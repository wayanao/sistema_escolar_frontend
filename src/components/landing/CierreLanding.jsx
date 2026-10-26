import { Link } from "react-router-dom";
import FondoMarca from "../FondoMarca";
import Aparecer from "./Aparecer";
import IconoLanding from "./IconoLanding";

function CierreLanding({ rutaIngreso }) {
  return (
    <section className="bg-white px-5 pb-24 sm:px-8 sm:pb-28">
      <Aparecer>
        <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white shadow-[0_40px_100px_rgba(46,16,101,0.35)] sm:px-12 sm:py-20">
          <FondoMarca animado />
          <h2 className="relative mx-auto max-w-2xl text-balance text-3xl font-black tracking-tight sm:text-5xl">
            Tu colegio, organizado de{" "}
            <span className="bg-gradient-to-r from-lime-200 to-lime-400 bg-clip-text text-transparent">
              verdad
            </span>
            .
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg leading-8 text-purple-100/85">
            ¿Ya usas Auligo? Ingresa con los datos que te asignó tu institución.
          </p>
          <Link
            to={rutaIngreso}
            className="group relative mt-9 inline-flex items-center gap-2 rounded-xl bg-lime-300 px-7 py-4 text-base font-bold text-slate-950 shadow-[0_0_48px_rgba(190,242,100,0.4)] transition hover:-translate-y-0.5 hover:bg-lime-200"
          >
            Ingresar a Auligo
            <IconoLanding nombre="flecha" className="h-5 w-5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Aparecer>
    </section>
  );
}

export default CierreLanding;
