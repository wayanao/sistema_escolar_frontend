import Aparecer from "./Aparecer";
import EncabezadoSeccion from "./EncabezadoSeccion";
import IconoLanding from "./IconoLanding";

function ConfianzaLanding({ puntos }) {
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Aparecer>
          <EncabezadoSeccion
            etiqueta="Tranquilidad"
            titulo="La información de tu colegio, cuidada"
          />
        </Aparecer>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {puntos.map((punto, indice) => (
            <Aparecer key={punto.titulo} retraso={indice * 90}>
              <article className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-purple-800 to-[#2a1150] p-8 text-white shadow-[0_24px_60px_rgba(76,29,149,0.28)]">
                <div
                  aria-hidden="true"
                  className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-lime-300/20 blur-2xl"
                />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lime-300">
                  <IconoLanding nombre={punto.icono} />
                </span>
                <h3 className="relative mt-6 text-lg font-black">{punto.titulo}</h3>
                <p className="relative mt-3 leading-7 text-purple-100/85">{punto.texto}</p>
              </article>
            </Aparecer>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ConfianzaLanding;
