import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function RankingMejorRendimiento() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const asignacionId = localStorage.getItem("asignacionId");
  const periodo = localStorage.getItem("periodo") || "1";
  const profesorStorage = localStorage.getItem("profesor");

  useEffect(() => {
    const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
    if (!profesor) {
      window.location.href = "/login";
      return;
    }

    if (!asignacionId) {
      alert("Selecciona una clase en el Dashboard para ver el ranking.");
      navigate("/");
      return;
    }

    const cargarRanking = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/dashboard/ranking-mejor/${asignacionId}/${periodo}`);
        setRanking(res.data);
      } catch (error) {
        console.error("Error cargando el ranking", error);
      } finally {
        setLoading(false);
      }
    };

    cargarRanking();
  }, [asignacionId, periodo, navigate, profesorStorage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏆 Ranking de Mejores Estudiantes
          </h1>
          <p className="text-gray-600">
            Estudiantes con un promedio de excelencia (entre 3.0 y 5.0) en el período {periodo}.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>

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
                      {isFirst ? "🥇 1" : index === 1 ? "🥈 2" : index === 2 ? "🥉 3" : index + 1}
                    </td>
                    <td className={`px-6 py-4 font-medium ${isFirst ? "text-green-800" : "text-gray-900"}`}>{est.nombre}</td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      {Number(est.promedio).toFixed(2)}
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
    </div>
  );
}

export default RankingMejorRendimiento;