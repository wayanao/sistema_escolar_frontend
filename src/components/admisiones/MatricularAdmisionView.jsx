// Matricular desde una admisión aprobada (paso E5). La ficha del estudiante
// llega ya armada (`children`): es el mismo formulario de Estudiantes, que
// compone la página. Esta vista solo pone el título y explica qué pasa.
export default function MatricularAdmisionView({ nombre, anio, esExalumno, children }) {
  return (
    <section
      aria-labelledby="titulo-matricular-admision"
      className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <h2 id="titulo-matricular-admision" className="text-xl font-bold text-gray-900">
        Matricular a {nombre} en {anio}
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Revisa los datos que vienen de la admisión, completa lo que falte y guarda. Lo de la
        entrevista (estudios anteriores y ocupación de los padres) pasa a la ficha. Al
        guardar, la admisión queda de solo consulta.
      </p>
      {esExalumno && (
        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {nombre} ya fue estudiante del colegio: se usa su mismo registro y conserva su
          historial. La ficha trae lo que ya tenía, con los datos del aspirante encima.
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
