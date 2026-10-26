import Aparecer from "./Aparecer";
import EncabezadoSeccion from "./EncabezadoSeccion";
import IconoLanding from "./IconoLanding";

// Preguntas frecuentes con `details`: se abren y cierran sin JavaScript y el
// teclado y los lectores de pantalla las entienden solos.
function PreguntasLanding({ preguntas }) {
  return (
    <section id="preguntas" className="scroll-mt-24 bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Aparecer>
          <EncabezadoSeccion etiqueta="Preguntas" titulo="Lo que suelen preguntarnos" />
        </Aparecer>

        <Aparecer className="mt-12">
          <div className="divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {preguntas.map((item) => (
              <details key={item.pregunta} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left text-base font-bold text-slate-900 transition hover:bg-purple-50/60 [&::-webkit-details-marker]:hidden">
                  {item.pregunta}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 transition duration-300 group-open:rotate-45 group-open:bg-purple-700 group-open:text-white">
                    <IconoLanding nombre="mas" className="h-4 w-4" />
                  </span>
                </summary>
                <p className="px-6 pb-6 leading-7 text-slate-600">{item.respuesta}</p>
              </details>
            ))}
          </div>
        </Aparecer>
      </div>
    </section>
  );
}

export default PreguntasLanding;
