import { useState } from "react";
import { contarRespondidas, preguntaVisible } from "../../utils/admisiones/cuestionario";
import PreguntaCuestionarioView from "./PreguntaCuestionarioView";

// Las preguntas del anexo de la entrevista (paso E11), por secciones que se
// abren y se cierran: así 55 preguntas no quedan en una página interminable.
// Cada sección dice cuántas van respondidas, y una con un error se abre sola.
// La lista la manda el backend. Solo presenta: qué sección está abierta es
// estado de la vista, no de la admisión.
export default function CuestionarioAdmisionView({
  secciones,
  respuestas,
  errores,
  error,
  deshabilitado,
  onCambiarRespuesta,
}) {
  const [abiertas, setAbiertas] = useState(() => new Set());

  if (secciones.length === 0 && !error) return null;

  const alternar = (clave) =>
    setAbiertas((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(clave)) siguientes.delete(clave);
      else siguientes.add(clave);
      return siguientes;
    });

  return (
    <section aria-labelledby="cuestionario-admision-titulo" className="space-y-3">
      <div>
        <h3
          id="cuestionario-admision-titulo"
          className="border-b pb-2 text-lg font-medium text-gray-900"
        >
          Preguntas del anexo
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Ninguna es obligatoria. Para quitar una respuesta, toca otra vez la casilla marcada.
        </p>
      </div>

      {error && (
        <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
        </p>
      )}

      {secciones.map((seccion) => {
        const visibles = seccion.preguntas.filter((pregunta) => preguntaVisible(pregunta, respuestas));
        const abierta =
          abiertas.has(seccion.clave) || visibles.some((pregunta) => errores[pregunta.clave]);
        const { respondidas, total } = contarRespondidas(seccion, respuestas);
        const idPanel = `cuestionario-seccion-${seccion.clave}`;

        return (
          <div key={seccion.clave} className="rounded-lg border border-gray-200">
            <button
              type="button"
              aria-expanded={abierta}
              aria-controls={idPanel}
              onClick={() => alternar(seccion.clave)}
              className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg px-4 py-2 text-left font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <span>{seccion.titulo}</span>
              <span className="flex shrink-0 items-center gap-2 text-sm font-normal text-gray-600">
                {respondidas} de {total}
                <span aria-hidden="true">{abierta ? "▲" : "▼"}</span>
              </span>
            </button>
            {abierta && (
              <div id={idPanel} className="grid grid-cols-1 gap-5 border-t px-4 py-4">
                {visibles.map((pregunta) => (
                  <PreguntaCuestionarioView
                    key={pregunta.clave}
                    pregunta={pregunta}
                    respuesta={respuestas[pregunta.clave]}
                    error={errores[pregunta.clave]}
                    deshabilitado={deshabilitado}
                    onCambiar={onCambiarRespuesta}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
