import FondoMarca from "../FondoMarca";
import Aparecer from "./Aparecer";
import EncabezadoSeccion from "./EncabezadoSeccion";

// Línea de tiempo de un día en el colegio: cuenta una historia en vez de
// listar funciones. La sección no recorta su contenido (`overflow-hidden`):
// eso anularía el título fijo de la izquierda, y el fondo ya se recorta solo.
function DiaConAuligo({ momentos }) {
  return (
    <section id="un-dia" className="relative isolate scroll-mt-24 bg-slate-950 py-24 sm:py-28">
      <FondoMarca />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Aparecer className="lg:sticky lg:top-32 lg:self-start">
          <EncabezadoSeccion
            oscuro
            centrado={false}
            etiqueta="Así se vive"
            titulo="Un día en tu colegio con Auligo"
            texto="De la primera lista de la mañana al cierre del mes, cada momento queda en su lugar."
          />
        </Aparecer>

        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute bottom-2 left-[11px] top-2 w-0.5 rounded-full bg-gradient-to-b from-purple-400 via-violet-400 to-lime-300 sm:left-[15px]"
          />
          <ol className="space-y-6 pl-10 sm:pl-12">
            {momentos.map((momento, indice) => (
              <li key={momento.titulo} className="relative">
                <Aparecer retraso={indice * 80}>
                  <span
                    aria-hidden="true"
                    className="absolute -left-10 top-6 flex h-6 w-6 items-center justify-center rounded-full border-2 border-lime-300 bg-slate-950 shadow-[0_0_18px_rgba(190,242,100,0.55)] sm:-left-12 sm:h-8 sm:w-8"
                  >
                    <span className="h-2 w-2 rounded-full bg-lime-300" />
                  </span>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md transition duration-300 hover:border-lime-300/40 hover:bg-white/[0.09]">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-300">
                      {momento.momento}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-white">{momento.titulo}</h3>
                    <p className="mt-2 leading-7 text-purple-100/80">{momento.texto}</p>
                  </div>
                </Aparecer>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default DiaConAuligo;
