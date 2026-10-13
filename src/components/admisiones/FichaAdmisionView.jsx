import { etiquetaResultado } from "../../utils/admisiones/admisiones";
import SpinnerView from "../anioLectivo/SpinnerView";
import FormularioAspiranteView from "./FormularioAspiranteView";
import FormularioEntrevistaView from "./FormularioEntrevistaView";
import ResultadoAdmisionView from "./ResultadoAdmisionView";

const nombreCompleto = ({ nombre, apellido }) => [nombre, apellido].filter(Boolean).join(" ");

function avisoSoloConsulta(admision) {
  if (admision.matriculada) return "Matriculado. Esta admisión es de solo consulta.";
  return "El año ya no está en preparación. Esta admisión es de solo consulta.";
}

// La ficha de un aspirante (paso E4): sus datos, la entrevista y el
// resultado. Qué se puede cambiar lo dice el backend (`editable`); sin eso,
// todo queda de solo consulta. Solo presenta.
export default function FichaAdmisionView({
  admision,
  formulario,
  errores,
  cursos,
  resultado,
  erroresResultado,
  guardando,
  guardandoResultado,
  borrando,
  onCambiar,
  onGuardar,
  onCambiarResultado,
  onGuardarResultado,
  onBorrar,
  onCerrar,
}) {
  const editable = admision.editable === true;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{nombreCompleto(admision)}</h2>
          <p className="mt-1 text-sm text-gray-600">
            Resultado: {admision.matriculada ? "Matriculado" : etiquetaResultado(admision.resultado)}
          </p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto"
        >
          Cerrar
        </button>
      </div>

      {admision.aviso_documento && (
        <p role="note" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {admision.aviso_documento.mensaje}
        </p>
      )}
      {!editable && (
        <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          {avisoSoloConsulta(admision)}
        </p>
      )}

      <form onSubmit={onGuardar} noValidate className="mt-4 space-y-6">
        <FormularioAspiranteView
          formulario={formulario}
          errores={errores}
          cursos={cursos}
          deshabilitado={!editable}
          onCambiar={onCambiar}
        />
        <FormularioEntrevistaView formulario={formulario} deshabilitado={!editable} onCambiar={onCambiar} />
        {editable && (
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {guardando && <SpinnerView />}
            {guardando ? "Guardando..." : "Guardar datos y entrevista"}
          </button>
        )}
      </form>

      <div className="mt-6">
        <ResultadoAdmisionView
          resultado={resultado}
          errores={erroresResultado}
          deshabilitado={!editable}
          guardando={guardandoResultado}
          onCambiar={onCambiarResultado}
          onGuardar={onGuardarResultado}
        />
      </div>

      {editable && (
        <div className="mt-6 border-t pt-4">
          <p className="text-sm text-gray-600">
            Borrar quita sus datos y su entrevista: por un error, o porque la familia pide
            retirar sus datos.
          </p>
          <button
            type="button"
            onClick={onBorrar}
            disabled={borrando}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {borrando && <SpinnerView />}
            {borrando ? "Borrando..." : "Borrar aspirante"}
          </button>
        </div>
      )}
    </section>
  );
}
