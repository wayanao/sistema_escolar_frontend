import Aparecer from "./Aparecer";
import EncabezadoSeccion from "./EncabezadoSeccion";
import IconoLanding from "./IconoLanding";

function ProblemasLanding({ problemas }) {
  return (
    <section className="relative bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Aparecer>
          <EncabezadoSeccion
            etiqueta="Por qué Auligo"
            titulo="Lo que deja de quitarte tiempo"
            texto="Los procesos que hoy viven en papeles, chats y hojas de cálculo, juntos y en orden."
          />
        </Aparecer>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {problemas.map((problema, indice) => (
            <Aparecer key={problema.titulo} retraso={indice * 90}>
              <article className="group h-full rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-purple-50/50 p-7 transition duration-300 hover:-translate-y-1.5 hover:border-purple-200 hover:shadow-[0_28px_60px_rgba(88,28,135,0.14)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 text-white shadow-[0_12px_28px_rgba(124,58,237,0.35)] transition duration-300 group-hover:scale-110">
                  <IconoLanding nombre={problema.icono} />
                </span>
                <h3 className="mt-6 text-lg font-black leading-snug text-slate-950">
                  {problema.titulo}
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-slate-600">{problema.texto}</p>
              </article>
            </Aparecer>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProblemasLanding;
