import { useNavigate } from "react-router-dom";
import TablaRankingMejor from "../components/dashboards/profesor/TablaRankingMejor";
import { useRankingMejorRendimiento } from "../hooks/dashboards/useRankingProfesor";

function RankingMejorRendimiento() {
  const navigate = useNavigate();
  const { ranking, loading, error, periodo } = useRankingMejorRendimiento();

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

      <TablaRankingMejor ranking={ranking} error={error} />
    </div>
  );
}

export default RankingMejorRendimiento;
