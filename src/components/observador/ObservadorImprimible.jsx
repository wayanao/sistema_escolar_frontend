import DocumentoImprimible from "../impresion/DocumentoImprimible";
import {
  agruparAnotacionesPorDimension,
  anotacionesEnOrdenCronologico,
  AGRUPACION_FECHA,
  dimensionesConTextoDeAnotacion,
  formatearFechaAnotacion,
  formatearPeriodoAnotacion,
} from "../../utils/observador/anotaciones";
import {
  firmasObservador,
  subtituloImpresion,
  tituloImpresion,
} from "../../utils/observador/impresion";

/**
 * El observador listo para imprimir.
 *
 * **Reutiliza `DocumentoImprimible`**, que ya aplica la identidad del colegio
 * -logo, colores- y la plantilla activa para `tipo="observaciones"`. Aquí solo
 * se pone el contenido: no hay que construir ningún impreso nuevo.
 *
 * **Sale lo que se está viendo**: el periodo que marque el selector y la
 * agrupación que esté puesta. Sin sorpresas.
 *
 * En papel no se pinta el color del profesor: el nombre va en negrita y ya. Un
 * documento que puede acabar fotocopiado en blanco y negro no puede apoyarse en
 * el color, y aquí no hace falta porque el nombre está escrito.
 *
 * Presentacional: sin hooks propios y sin HTTP.
 */
export default function ObservadorImprimible({
  alumno,
  periodo,
  agrupacion,
  anotaciones,
  opcion,
  profesor,
  onVolver,
}) {
  const lista = anotaciones || [];

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

      <DocumentoImprimible
        tipo="observaciones"
        titulo={tituloImpresion(opcion)}
        subtitulo={subtituloImpresion({ alumno, periodo })}
        firmas={firmasObservador(opcion, profesor)}
      >
        {lista.length === 0 ? (
          <p className="text-sm">No hay anotaciones para este reporte.</p>
        ) : agrupacion === AGRUPACION_FECHA ? (
          <ListadoPorFecha anotaciones={lista} />
        ) : (
          <ListadoPorDimension anotaciones={lista} />
        )}
      </DocumentoImprimible>
    </div>
  );
}

function Quien({ anotacion }) {
  const partes = [
    anotacion.profesor || "Profesor sin nombre",
    formatearFechaAnotacion(anotacion.creada_en),
    formatearPeriodoAnotacion(anotacion.periodo),
  ].filter(Boolean);

  return <strong>{partes.join(" · ")}</strong>;
}

function ListadoPorDimension({ anotaciones }) {
  return (
    <div className="space-y-4">
      {agruparAnotacionesPorDimension(anotaciones).map((grupo) => (
        <section key={grupo.campo}>
          <h3 className="mb-2 border-b border-slate-400 pb-1 text-sm font-bold uppercase tracking-wider">
            {grupo.titulo}
          </h3>
          <ul className="space-y-2">
            {grupo.entradas.map((entrada) => (
              <li key={`${grupo.campo}-${entrada.anotacion.id}`} className="text-sm">
                <Quien anotacion={entrada.anotacion} />
                <p className="whitespace-pre-line">{entrada.texto}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ListadoPorFecha({ anotaciones }) {
  return (
    <ul className="space-y-3">
      {anotacionesEnOrdenCronologico(anotaciones).map((anotacion) => (
        <li key={anotacion.id} className="text-sm">
          <Quien anotacion={anotacion} />
          {dimensionesConTextoDeAnotacion(anotacion).map((dimension) => (
            <p key={dimension.campo} className="whitespace-pre-line">
              <span className="font-medium">{`${dimension.titulo}: `}</span>
              {dimension.texto}
            </p>
          ))}
        </li>
      ))}
    </ul>
  );
}
