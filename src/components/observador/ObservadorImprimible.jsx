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
  avisoSinFirmaDirector,
  firmasObservador,
  MENSAJE_CARGANDO_FIRMAS,
  MENSAJE_ERROR_FIRMAS,
  subtituloImpresion,
  textoFirmaImpresa,
  tituloImpresion,
} from "../../utils/observador/impresion";

const SIN_FIRMAS = {};

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
 * **Firmas guardadas (2026-11-18).** Debajo de cada anotación firmada por el
 * acudiente va su firma, con su nombre, documento, fecha y ante quién
 * (`firmasAcudiente`, por `anotacion_id`); en la vista por dimensión, en cada
 * bloque, como el sello en pantalla. En el impreso del admin, la raya del
 * director de grupo lleva su firma guardada (`firmaDirector`). Las pide
 * `ImpresionObservador`; mientras llegan, o si fallan, se avisa solo en
 * pantalla.
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
  firmasAcudiente = SIN_FIRMAS,
  firmaDirector = null,
  cargandoFirmas = false,
  errorFirmas = false,
}) {
  const lista = anotaciones || [];
  const avisos = [
    cargandoFirmas && MENSAJE_CARGANDO_FIRMAS,
    errorFirmas && MENSAJE_ERROR_FIRMAS,
    avisoSinFirmaDirector(firmaDirector),
  ].filter(Boolean);

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

      {avisos.length > 0 && (
        <div
          role="status"
          className="no-print mx-auto mt-16 w-full max-w-[215.9mm] space-y-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {avisos.map((aviso) => (
            <p key={aviso}>{aviso}</p>
          ))}
        </div>
      )}

      <DocumentoImprimible
        tipo="observaciones"
        titulo={tituloImpresion(opcion)}
        subtitulo={subtituloImpresion({ alumno, periodo })}
        firmas={firmasObservador(opcion, profesor, firmaDirector)}
      >
        {lista.length === 0 ? (
          <p className="text-sm">No hay anotaciones para este reporte.</p>
        ) : agrupacion === AGRUPACION_FECHA ? (
          <ListadoPorFecha anotaciones={lista} firmas={firmasAcudiente} />
        ) : (
          <ListadoPorDimension anotaciones={lista} firmas={firmasAcudiente} />
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

// La firma del acudiente bajo su anotación. Si el texto ya no es el que se
// firmó (`integra: false`), lo dice también en el papel.
function FirmaAcudiente({ firma }) {
  if (!firma) return null;
  return (
    <div className="mt-1 flex items-end gap-3 break-inside-avoid">
      {firma.imagen && (
        <img
          src={firma.imagen}
          alt={`Firma de ${firma.firmante_nombre}`}
          className="h-10 w-auto max-w-[160px] object-contain"
        />
      )}
      <p className="text-[11px] leading-snug text-slate-700">
        {textoFirmaImpresa(firma)}
        {firma.integra === false && (
          <span className="block font-semibold">
            ⚠ El texto de esta anotación ya no coincide con lo que se firmó.
          </span>
        )}
      </p>
    </div>
  );
}

function ListadoPorDimension({ anotaciones, firmas }) {
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
                <FirmaAcudiente firma={firmas[entrada.anotacion.id]} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ListadoPorFecha({ anotaciones, firmas }) {
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
          <FirmaAcudiente firma={firmas[anotacion.id]} />
        </li>
      ))}
    </ul>
  );
}
