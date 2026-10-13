import SpinnerView from "../anioLectivo/SpinnerView";
import FormularioAspiranteView from "./FormularioAspiranteView";

// Registrar un aspirante (paso E4). Al registrarlo, la página abre su ficha
// para seguir con la entrevista. Solo presenta.
export default function NuevoAspiranteView({
  anio,
  formulario,
  errores,
  cursos,
  guardando,
  onCambiar,
  onRegistrar,
  onCancelar,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-gray-900">Nuevo aspirante para {anio}</h2>
      <form onSubmit={onRegistrar} noValidate className="mt-4">
        <FormularioAspiranteView
          formulario={formulario}
          errores={errores}
          cursos={cursos}
          deshabilitado={false}
          onCambiar={onCambiar}
        />
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {guardando && <SpinnerView />}
            {guardando ? "Registrando..." : "Registrar aspirante"}
          </button>
          <button
            type="button"
            onClick={onCancelar}
            className="w-full rounded-lg bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600 sm:w-auto"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
