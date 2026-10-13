import { formatMoney } from "../../utils/carteraTiposPago/formatos";
import SpinnerView from "./SpinnerView";

export default function ResumenPreparacionView({ anio, resumen, cargando }) {
  const datos = resumen?.resumen;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-gray-900">3. Resumen de lo preparado</h2>
      <p className="mt-2 text-sm text-gray-600">
        Estos conteos pertenecen únicamente a {anio}. Este resumen no activa el año.
      </p>

      {cargando && !datos ? (
        <p className="mt-5 flex items-center gap-2 text-sm text-gray-600">
          <SpinnerView />
          Cargando resumen...
        </p>
      ) : datos ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <ResumenDato texto={contar(datos.cursos, "curso", "cursos")} />
          <ResumenDato
            texto={contar(datos.conceptos_pago, "concepto de pago", "conceptos de pago")}
          />
          <ResumenDato
            texto={contar(
              datos.estudiantes_matriculados,
              "estudiante matriculado",
              "estudiantes matriculados",
            )}
          />
          <ResumenDato
            texto={contar(datos.valores_especiales, "valor especial", "valores especiales")}
          />
          <ResumenDato
            texto={contar(datos.pagos_registrados, "pago registrado", "pagos registrados")}
          />
          <ResumenDato texto={`${formatMoney(datos.total_pagado)} pagado`} />
        </div>
      ) : (
        <p className="mt-5 text-sm text-gray-600">Todavía no hay resumen disponible.</p>
      )}
    </section>
  );
}

function contar(cantidad, singular, plural) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}

function ResumenDato({ texto }) {
  return (
    <div className="rounded-lg border border-purple-100 bg-purple-50 p-4 text-center text-sm font-semibold text-purple-950">
      {texto}
    </div>
  );
}
