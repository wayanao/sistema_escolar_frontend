import DocumentoImprimible from "../impresion/DocumentoImprimible";
import {
  TITULO_ENTREVISTA,
  datosEntrevistaParaImprimir,
  firmasEntrevista,
  subtituloEntrevista,
} from "../../utils/admisiones/impresion";
import { entrevistaParaImprimir } from "../../utils/cuestionarioAdmision";

/**
 * La entrevista de admisión lista para imprimir y firmar (paso E12).
 *
 * **Reutiliza `DocumentoImprimible`** con la plantilla "Reporte de
 * estudiante" (`tipo="reporte_estudiante"`), la misma de certificados y
 * estado de cuenta: logo, colores, pie y firmas del colegio, sin un tipo de
 * plantilla nuevo en el backend.
 *
 * Salen **todas** las preguntas del anexo (decisión del usuario): las
 * respondidas con su casilla marcada o lo escrito, y las demás en blanco para
 * llenarlas a mano. Así reemplaza al anexo en papel. El resultado de la
 * entrevista no sale.
 *
 * Presentacional: sin hooks propios y sin HTTP.
 */
export default function EntrevistaImprimible({ admision, secciones, onVolver }) {
  const { secciones: datos, observaciones } = datosEntrevistaParaImprimir(admision);
  const anexo = entrevistaParaImprimir({ secciones }, admision.cuestionario);

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-100">
      <div className="fixed left-4 top-4 z-[60] no-print">
        <button
          type="button"
          onClick={onVolver}
          className="rounded-lg bg-slate-800 px-4 py-2 text-white shadow hover:bg-slate-900"
        >
          ← Volver
        </button>
      </div>

      {anexo.length === 0 && (
        <p className="no-print mx-4 mt-16 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 sm:mx-auto sm:max-w-3xl">
          No se pudieron cargar las preguntas del anexo: el impreso sale sin ellas.
        </p>
      )}

      <DocumentoImprimible
        tipo="reporte_estudiante"
        titulo={TITULO_ENTREVISTA}
        subtitulo={subtituloEntrevista(admision)}
        firmas={firmasEntrevista(admision)}
      >
        <div className="space-y-5 text-sm">
          {datos.map((seccion) => (
            <Seccion key={seccion.titulo} titulo={seccion.titulo}>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {seccion.filas.map((fila) => (
                  <Fila key={fila.etiqueta} {...fila} />
                ))}
              </dl>
            </Seccion>
          ))}

          {anexo.length > 0 && (
            <Seccion titulo="Preguntas del anexo">
              <div className="space-y-4">
                {anexo.map((seccion) => (
                  <div key={seccion.clave}>
                    <h4 className="mb-2 font-semibold">{seccion.titulo}</h4>
                    <div className="space-y-3">
                      {seccion.preguntas.map((pregunta) => (
                        <PreguntaImpresa key={pregunta.clave} pregunta={pregunta} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Seccion>
          )}

          <Seccion titulo="Observaciones de quien entrevista">
            <Renglon valor={observaciones} largo />
          </Seccion>
        </div>
      </DocumentoImprimible>
    </div>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section>
      <h3 className="mb-2 border-b border-slate-400 pb-1 text-sm font-bold uppercase tracking-wider">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function Fila({ etiqueta, valor, largo }) {
  return (
    <div className={`break-inside-avoid ${largo ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs text-slate-600">{etiqueta}</dt>
      <dd>
        <Renglon valor={valor} largo={largo} />
      </dd>
    </div>
  );
}

// Lo escrito, o una raya para escribir a mano (dos si el texto es largo).
function Renglon({ valor, largo = false }) {
  if (valor) return <span className="whitespace-pre-line font-medium">{valor}</span>;
  return (
    <span aria-label="En blanco" className="block">
      <span className="block h-6 border-b border-slate-500" />
      {largo && <span className="block h-6 border-b border-slate-500" />}
    </span>
  );
}

function Casilla({ etiqueta, marcada }) {
  return (
    <span
      role="img"
      aria-label={`${etiqueta}, ${marcada ? "marcada" : "sin marcar"}`}
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center border border-slate-800 text-[11px] font-bold leading-none"
    >
      {marcada ? "✓" : ""}
    </span>
  );
}

function PreguntaImpresa({ pregunta }) {
  return (
    <div role="group" aria-label={pregunta.texto} className="break-inside-avoid">
      <p className="font-medium">{pregunta.texto}</p>
      {pregunta.nota && <p className="text-xs italic text-slate-600">{pregunta.nota}</p>}
      {pregunta.opciones ? (
        <>
          <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
            {pregunta.opciones.map((opcion) => (
              <li key={opcion.etiqueta} className="inline-flex items-center gap-1.5">
                <Casilla etiqueta={opcion.etiqueta} marcada={opcion.marcada} />
                {opcion.etiqueta}
              </li>
            ))}
          </ul>
          {pregunta.aparte && (
            <div className="mt-1 flex items-end gap-2">
              <span className="shrink-0">{pregunta.aparte.texto}</span>
              <span className="min-w-0 flex-1">
                <Renglon valor={pregunta.aparte.valor} />
              </span>
            </div>
          )}
        </>
      ) : (
        <Renglon valor={pregunta.valor} largo={pregunta.largo} />
      )}
    </div>
  );
}
