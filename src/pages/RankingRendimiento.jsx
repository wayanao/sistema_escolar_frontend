import { Navigate, useNavigate } from "react-router-dom";
import AvisoSinClaseElegida from "../components/AvisoSinClaseElegida";
import SelectorClaseTrabajo from "../components/SelectorClaseTrabajo";
import SeleccionClaseRanking from "../components/dashboards/profesor/SeleccionClaseRanking";
import TablaRankingBajo from "../components/dashboards/profesor/TablaRankingBajo";
import useClaseRankingProfesor from "../hooks/dashboards/useClaseRankingProfesor";
import { useRankingBajoRendimiento } from "../hooks/dashboards/useRankingProfesor";

function RankingBajoRendimiento() {
  const navigate = useNavigate();
  const profesorStorage = localStorage.getItem("profesor");
  const profesorId = profesorStorage ? JSON.parse(profesorStorage)?.id : undefined;

  const {
    opciones,
    cargandoClases,
    errorClases,
    reintentarClases,
    asignacionEfectiva,
    cambiarAsignacion,
    periodo,
    cambiarPeriodo,
    sinClase,
  } = useClaseRankingProfesor(profesorId);

  const { ranking, loading, error, sesionInvalida } = useRankingBajoRendimiento({
    asignacionId: asignacionEfectiva,
    periodo,
  });

  if (sesionInvalida) {
    return <Navigate to="/login" />;
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

      <SeleccionClaseRanking>
        <SelectorClaseTrabajo
          idPrefijo="ranking-bajo"
          opciones={opciones}
          asignacionId={asignacionEfectiva}
          onCambiarAsignacion={cambiarAsignacion}
          cargando={cargandoClases}
          error={errorClases}
          onReintentar={reintentarClases}
          periodo={periodo}
          onCambiarPeriodo={cambiarPeriodo}
        />
      </SeleccionClaseRanking>

      {!asignacionEfectiva ? (
        <AvisoSinClaseElegida
          titulo={sinClase?.titulo}
          texto={sinClase?.texto}
          cargando={cargandoClases}
        />
      ) : loading ? (
        <div className="flex justify-center py-16" role="status" aria-label="Cargando el ranking">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <TablaRankingBajo ranking={ranking} error={error} />
      )}
    </div>
  );
}

export default RankingBajoRendimiento;
