import {
  FILTRO_TODOS,
  FILTROS_RESULTADO,
  conteoDeFiltro,
  etiquetaResultado,
} from "../../utils/admisiones/admisiones";
import SpinnerView from "../anioLectivo/SpinnerView";

const COLORES_RESULTADO = {
  pendiente: "bg-amber-100 text-amber-900",
  aprobado: "bg-emerald-100 text-emerald-900",
  no_aprobado: "bg-gray-200 text-gray-800",
};

const nombreCompleto = ({ nombre, apellido }) => [nombre, apellido].filter(Boolean).join(" ");

function textoDocumento({ tipo_documento, documento_identidad }) {
  if (!documento_identidad) return "Sin documento";
  return tipo_documento ? `${tipo_documento} ${documento_identidad}` : documento_identidad;
}

function textoCurso({ curso_nombre, curso_jornada }) {
  if (!curso_nombre) return "Sin curso";
  return curso_jornada ? `${curso_nombre} · ${curso_jornada}` : curso_nombre;
}

function Insignia({ admision }) {
  if (admision.matriculada) {
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-900">
        Matriculado
      </span>
    );
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        COLORES_RESULTADO[admision.resultado] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {etiquetaResultado(admision.resultado)}
    </span>
  );
}

// La lista de aspirantes del año, con el filtro por resultado (paso E4). El
// filtro y los botones los decide la página con lo que dice el backend
// (`editable`); aquí solo se presenta.
export default function ListaAdmisionesView({
  anio,
  editable,
  conteos,
  filtro,
  onCambiarFiltro,
  admisiones,
  cargando,
  seleccionadaId,
  onNuevo,
  onAbrir,
}) {
  const titulo = `Aspirantes de ${anio}`;

  return (
    <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
        {editable && (
          <button
            type="button"
            onClick={onNuevo}
            className="w-full rounded-lg bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-800 sm:w-auto"
          >
            Nuevo aspirante
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por resultado">
        {FILTROS_RESULTADO.map(({ valor, etiqueta }) => {
          const elegido = filtro === valor;
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={elegido}
              onClick={() => onCambiarFiltro(valor)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                elegido
                  ? "border-purple-700 bg-purple-700 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {`${etiqueta} (${conteoDeFiltro(conteos, valor)})`}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-gray-600">Matriculados: {conteos.matriculado}</p>

      {admisiones.length === 0 ? (
        cargando ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <SpinnerView />
            Cargando aspirantes...
          </p>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            {filtro === FILTRO_TODOS
              ? `Todavía no hay aspirantes para ${anio}.`
              : "No hay aspirantes con este resultado."}
          </p>
        )
      ) : (
        <ul aria-label={titulo} className="mt-4 space-y-2">
          {admisiones.map((admision) => {
            const nombre = nombreCompleto(admision);
            const seleccionada = admision.id === seleccionadaId;
            return (
              <li
                key={admision.id}
                aria-label={nombre}
                className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                  seleccionada ? "border-purple-400 bg-purple-50" : "border-gray-200"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">{nombre}</span>
                    <Insignia admision={admision} />
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    <span>{textoDocumento(admision)}</span>
                    {" · "}
                    <span>{textoCurso(admision)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAbrir(admision.id)}
                  aria-label={`Abrir ${nombre}`}
                  className="w-full rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-semibold text-purple-800 hover:bg-purple-50 sm:w-auto"
                >
                  Abrir
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
