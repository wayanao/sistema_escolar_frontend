import {
  etiquetaPuestoMejorRendimiento,
  formatearPromedio,
} from "../../../utils/dashboards/profesor";

// Hermano de TablaRankingBajo: comparte estructura pero no colores, columna de
// puesto, insignia ni estado vacío.
function TablaRankingMejor({ ranking }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {ranking.length > 0 ? (
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-4">Top</th>
              <th className="px-6 py-4">Nombre del Estudiante</th>
              <th className="px-6 py-4">Promedio</th>
              <th className="px-6 py-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((est, index) => {
              const isFirst = index === 0;
              return (
                <tr key={est.id} className="border-b hover:bg-green-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {etiquetaPuestoMejorRendimiento(index)}
                  </td>
                  <td className={`px-6 py-4 font-medium ${isFirst ? "text-green-800" : "text-gray-900"}`}>{est.nombre}</td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    {formatearPromedio(est.promedio)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Excelente</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <span className="text-4xl mb-3 block">🧐</span>
          <p className="text-lg">No hay estudiantes con promedio entre 3.0 y 5.0 en esta clase para el periodo seleccionado.</p>
        </div>
      )}
    </div>
  );
}

export default TablaRankingMejor;
