import { useState } from "react";
import { contarRespondidas, preguntaVisible } from "../../utils/admisiones/cuestionario";
import PreguntaCuestionarioView from "./PreguntaCuestionarioView";

const SIN_APARTADOS = [];

// Las preguntas del anexo de la entrevista (paso E11), por secciones que se
// abren y se cierran: así 55 preguntas no quedan en una página interminable.
// Cada sección dice cuántas van respondidas, y una con un error se abre sola.
// La lista la manda el backend. Solo presenta: qué sección está abierta es
// estado de la vista, no de la admisión.
//
// Desde el 2026-10-20 (a pedido del usuario), sin el título "Preguntas del
// anexo" y con `apartados`: lo de la entrevista que no son preguntas del anexo,
// en las mismas secciones. Cada apartado es `{ clave, titulo, respondidas,
// total, contenido, dentroDe? }`. Con `dentroDe` va al inicio de esa sección
// del anexo y suma a su conteo; sin él, o si esa sección no llegó, es una
// sección propia, antes de las del anexo.
export default function CuestionarioAdmisionView({
  secciones,
  respuestas,
  errores,
  error,
  deshabilitado,
  onCambiarRespuesta,
  apartados = SIN_APARTADOS,
}) {
  const [abiertas, setAbiertas] = useState(() => new Set());

  const clavesDelAnexo = new Set(secciones.map((seccion) => seccion.clave));
  const propios = apartados.filter((apartado) => !clavesDelAnexo.has(apartado.dentroDe));
  const alInicioDe = new Map(
    apartados
      .filter((apartado) => clavesDelAnexo.has(apartado.dentroDe))
      .map((apartado) => [apartado.dentroDe, apartado]),
  );

  if (secciones.length === 0 && propios.length === 0 && !error) return null;

  const alternar = (clave) =>
    setAbiertas((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(clave)) siguientes.delete(clave);
      else siguientes.add(clave);
      return siguientes;
    });

  return (
    <section aria-label="Preguntas de la entrevista" className="space-y-3">
      <p className="text-sm text-gray-600">
        Ninguna es obligatoria. Para quitar una respuesta, toca otra vez la casilla marcada.
      </p>

      {error && (
        <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
        </p>
      )}

      {propios.map((apartado) => (
        <SeccionPlegable
          key={apartado.clave}
          clave={apartado.clave}
          titulo={apartado.titulo}
          respondidas={apartado.respondidas}
          total={apartado.total}
          abierta={abiertas.has(apartado.clave)}
          onAlternar={alternar}
        >
          {apartado.contenido}
        </SeccionPlegable>
      ))}

      {secciones.map((seccion) => {
        const visibles = seccion.preguntas.filter((pregunta) => preguntaVisible(pregunta, respuestas));
        const abierta =
          abiertas.has(seccion.clave) || visibles.some((pregunta) => errores[pregunta.clave]);
        const delAnexo = contarRespondidas(seccion, respuestas);
        const apartado = alInicioDe.get(seccion.clave);

        return (
          <SeccionPlegable
            key={seccion.clave}
            clave={seccion.clave}
            titulo={seccion.titulo}
            respondidas={delAnexo.respondidas + (apartado?.respondidas ?? 0)}
            total={delAnexo.total + (apartado?.total ?? 0)}
            abierta={abierta}
            onAlternar={alternar}
          >
            {apartado?.contenido}
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
          </SeccionPlegable>
        );
      })}
    </section>
  );
}

function SeccionPlegable({ clave, titulo, respondidas, total, abierta, onAlternar, children }) {
  const idPanel = `cuestionario-seccion-${clave}`;

  return (
    <div className="rounded-lg border border-gray-200">
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={idPanel}
        onClick={() => onAlternar(clave)}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg px-4 py-2 text-left font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        <span>{titulo}</span>
        <span className="flex shrink-0 items-center gap-2 text-sm font-normal text-gray-600">
          {respondidas} de {total}
          <span aria-hidden="true">{abierta ? "▲" : "▼"}</span>
        </span>
      </button>
      {abierta && (
        <div id={idPanel} className="grid grid-cols-1 gap-5 border-t px-4 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
