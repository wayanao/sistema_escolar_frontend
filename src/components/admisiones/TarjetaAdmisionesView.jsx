import { Link } from "react-router-dom";
import SpinnerView from "../anioLectivo/SpinnerView";

// Acceso a admisiones desde la preparación del año (entrevista de admisión,
// paso E4), con los conteos que da el backend. Solo presenta.
export default function TarjetaAdmisionesView({ anio, conteos, cargando, error }) {
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-6">
      <h2 className="text-lg font-bold text-emerald-950">Admisiones {anio}</h2>
      <p className="mt-1 text-sm text-emerald-900">
        Registra a los aspirantes nuevos de {anio}, haz la entrevista con la familia y deja
        el resultado. Quien ya estudia en el colegio pasa con Matricular estudiantes.
      </p>

      {cargando ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-900">
          <SpinnerView />
          Cargando admisiones...
        </p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-700">{error}</p>
      ) : (
        <div className="mt-3 grid gap-2 text-sm text-emerald-950 sm:grid-cols-2 lg:grid-cols-4">
          <span>Pendientes: {conteos.pendiente}</span>
          <span>Aprobados: {conteos.aprobado}</span>
          <span>No aprobados: {conteos.no_aprobado}</span>
          <span>Matriculados: {conteos.matriculado}</span>
        </div>
      )}

      <Link
        to="/admin/anios-lectivos/admisiones"
        className="mt-4 inline-block w-full rounded-lg bg-emerald-700 px-4 py-2 text-center font-semibold text-white hover:bg-emerald-800 sm:w-auto"
      >
        Ir a admisiones
      </Link>
    </section>
  );
}
