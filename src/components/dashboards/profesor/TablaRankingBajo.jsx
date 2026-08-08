import { formatearPromedio } from "../../../utils/dashboards/profesor";

// Hermano de TablaRankingMejor, no una variante suya: difieren en la columna de
// puesto, los colores, la insignia y el estado vacío. Compartir un solo
// componente exigiría pasar esas diferencias por props y no ahorraría nada.
function TablaRankingBajo({ ranking }) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {ranking.length > 0 ? (
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-4">Puesto</th>
              <th className="px-6 py-4">Nombre del Estudiante</th>
              <th className="px-6 py-4">Promedio</th>
              <th className="px-6 py-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((est, index) => (
              <tr key={est.id} className="border-b hover:bg-red-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{est.nombre}</td>
                <td className="px-6 py-4 font-bold text-red-600">
                  {formatearPromedio(est.promedio)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">Critico</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <span className="text-4xl mb-3 block">🎉</span>
          <p className="text-lg">No hay estudiantes con bajo rendimiento (promedio menor a 3) en esta clase para el periodo seleccionado.</p>
        </div>
      )}
    </div>
  );
}

export default TablaRankingBajo;
