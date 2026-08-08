import { useNavigate } from "react-router-dom";
import TablaRankingBajo from "../components/dashboards/profesor/TablaRankingBajo";
import { useRankingBajoRendimiento } from "../hooks/dashboards/useRankingProfesor";

function RankingBajoRendimiento() {
  const navigate = useNavigate();
  const { ranking, loading, periodo } = useRankingBajoRendimiento();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📉 Ranking de Bajo Rendimiento
          </h1>
          <p className="text-gray-600">
            Estudiantes con un promedio inferior a 3.0 en el período {periodo}.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>

      <TablaRankingBajo ranking={ranking} />
    </div>
  );
}

export default RankingBajoRendimiento;
