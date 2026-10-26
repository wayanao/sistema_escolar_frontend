import Aparecer from "./Aparecer";
import EncabezadoSeccion from "./EncabezadoSeccion";

const numeroDePaso = (indice) => String(indice + 1).padStart(2, "0");

function PasosLanding({ pasos }) {
  return (
    <section id="como-empezar" className="scroll-mt-24 bg-slate-50 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Aparecer>
          <EncabezadoSeccion
            etiqueta="Cómo empezar"
            titulo="De cero a funcionando, en tres pasos"
          />
        </Aparecer>

        <div className="mt-16">
          <ol className="grid gap-6 md:grid-cols-3">
            {pasos.map((paso, indice) => (
              <li key={paso.titulo}>
                <Aparecer retraso={indice * 120} className="h-full">
                  <div className="h-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(88,28,135,0.12)]">
                    <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-700 to-violet-500 text-2xl font-black text-white shadow-[0_14px_34px_rgba(109,40,217,0.35)] ring-8 ring-purple-50">
                      {numeroDePaso(indice)}
                    </span>
                    <h3 className="mt-6 text-xl font-black text-slate-950">{paso.titulo}</h3>
                    <p className="mt-3 leading-7 text-slate-600">{paso.texto}</p>
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

export default PasosLanding;
