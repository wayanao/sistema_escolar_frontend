import { useNavigate } from "react-router-dom";
import CumpleanosSemana from "../components/dashboards/CumpleanosSemana";
import AccesosAdmin from "../components/dashboards/admin/AccesosAdmin";
import TarjetaCarteraVencida from "../components/dashboards/admin/TarjetaCarteraVencida";
import useDashboardAdmin from "../hooks/dashboards/useDashboardAdmin";
import { RUTA_CARTERA_VENCIDA } from "../utils/dashboards/admin";

function Admin() {
  const navigate = useNavigate();
  const {
    esAdministrador,
    nombreAdmin,
    resumenCartera,
    errorCartera,
    cumpleanos,
    loadingCumpleanos,
    errorCumpleanos,
    diasRangoCumpleanos,
  } = useDashboardAdmin();

  if (!esAdministrador) {
    navigate("/login");
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-700">
          <span>
            Hola, <strong className="font-bold text-gray-950">{nombreAdmin}</strong>
          </span>
          <span className="text-sm text-gray-600">
            🚀 Organiza tu colegio y toma buenas decisiones hoy.
          </span>
        </p>
      </div>

      <TarjetaCarteraVencida
        resumen={resumenCartera}
        error={errorCartera}
        onAbrir={() => navigate(RUTA_CARTERA_VENCIDA)}
      />

      <AccesosAdmin onAbrir={navigate} />

      <CumpleanosSemana
        className="mt-6"
        estudiantes={cumpleanos}
        loading={loadingCumpleanos}
        error={errorCumpleanos}
        diasRango={diasRangoCumpleanos}
        emptyText="Esta semana no hay estudiantes activos de cumpleaños."
      />
    </div>
  );
}

export default Admin;
