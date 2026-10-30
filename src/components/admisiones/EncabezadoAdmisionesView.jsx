import { Link } from "react-router-dom";
import SpinnerView from "../anioLectivo/SpinnerView";

const enlaceVolver =
  "text-sm font-semibold text-purple-700 hover:text-purple-900";

// Título, avisos y regreso a Años lectivos de la página de admisiones.
export default function EncabezadoAdmisionesView({ anio, mensaje, error }) {
  return (
    <>
      <header>
        <Link to="/admin/anios-lectivos" className={enlaceVolver}>
          ← Años lectivos
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">Admisiones {anio}</h1>
        <p className="mt-2 text-gray-600">
          Aspirantes nuevos de {anio}: regístralos, haz la entrevista y deja el resultado.
          Solo un aspirante aprobado se podrá matricular.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="whitespace-pre-line rounded-lg border border-red-300 bg-red-50 p-3 text-red-800 sm:p-4"
        >
          {error}
        </div>
      )}
      {mensaje && (
        <div
          role="status"
          className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 sm:p-4"
        >
          {mensaje}
        </div>
      )}
    </>
  );
}

// Sin año en preparación no hay admisiones: se dice cómo crearlo.
export function SinAnioEnPreparacionView({ cargando }) {
  return (
    <div className="w-full space-y-4 py-2">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admisiones</h1>
      {cargando ? (
        <p className="flex items-center gap-2 text-sm text-gray-600">
          <SpinnerView />
          Cargando años lectivos...
        </p>
      ) : (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p>
            No hay un año en preparación. Créalo en Años lectivos para registrar aspirantes.
          </p>
          <Link
            to="/admin/anios-lectivos"
            className="mt-3 inline-block w-full rounded-lg bg-white px-4 py-2 text-center font-semibold text-amber-900 shadow-sm hover:bg-amber-100 sm:w-auto"
          >
            Ir a Años lectivos
          </Link>
        </div>
      )}
    </div>
  );
}

// 2026-10-30: en un colegio que no usa la entrevista de admisión. Lo decide
// el backend (`GET /tenant/status`), que además rechaza registrar o
// matricular desde aquí.
export function SinEntrevistaView() {
  return (
    <div className="w-full space-y-4 py-2">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Admisiones</h1>
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <p>
          Este colegio no usa la entrevista de admisión. Los estudiantes nuevos del año
          en preparación se crean con &quot;Crear estudiante&quot;, en Años lectivos.
        </p>
        <Link
          to="/admin/anios-lectivos"
          className="mt-3 inline-block w-full rounded-lg bg-white px-4 py-2 text-center font-semibold text-amber-900 shadow-sm hover:bg-amber-100 sm:w-auto"
        >
          Ir a Años lectivos
        </Link>
      </div>
    </div>
  );
}
