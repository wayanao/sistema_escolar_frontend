import { useNavigate } from "react-router-dom";
import DetalleReportes from "../components/reportesFinancieros/DetalleReportes";
import MovimientoMensual from "../components/reportesFinancieros/MovimientoMensual";
import RangoFechasPanel from "../components/reportesFinancieros/RangoFechasPanel";
import ResumenFinanciero from "../components/reportesFinancieros/ResumenFinanciero";
import useDetalleReportes from "../hooks/reportesFinancieros/useDetalleReportes";
import useReporteGeneral from "../hooks/reportesFinancieros/useReporteGeneral";
import { hoyISO } from "../utils/reportesFinancieros/formatos";

function ReportesAdmin() {
  const navigate = useNavigate();
  const { loading, cargarDatosIniciales, stats, estudiantesPorCurso, mesesFinancieros } = useReporteGeneral();
  const {
    detalle,
    setDetalle,
    detalleTipo,
    setDetalleTipo,
    detalleTitulo,
    loadingDetalle,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    rangoActivo,
    filtroMedioIngreso,
    setFiltroMedioIngreso,
    detalleRef,
    cargarDetalle,
    cargarDetalleMes,
    detalleEgresos,
    detalleIngresosFiltrados,
    totalDetalleIngresos,
    totalDetalleEgresos,
  } = useDetalleReportes();

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  const verIngresosHoy = () =>
    cargarDetalle({ tipo: "ingresos", inicio: hoyISO(), fin: hoyISO(), titulo: "Ingresos de hoy" });
  const verEgresosHoy = () =>
    cargarDetalle({ tipo: "egresos", inicio: hoyISO(), fin: hoyISO(), titulo: "Egresos de hoy" });
  const verEgresosAcumulados = () =>
    cargarDetalle({
      tipo: "egresos",
      inicio: rangoActivo.inicio,
      fin: rangoActivo.fin,
      titulo: `${rangoActivo.inicio} a ${rangoActivo.fin}`,
    });
  const verIngresosMes = (mes) => cargarDetalleMes("ingresos", mes);
  const verEgresosMes = (mes) => cargarDetalleMes("egresos", mes);
  const consultarIngresosPorRango = () => {
    setDetalleTipo("ingresos");
    cargarDetalle({ tipo: "ingresos", inicio: fechaInicio, fin: fechaFin, titulo: `${fechaInicio} a ${fechaFin}` });
  };
  const consultarEgresosPorRango = () => {
    setDetalleTipo("egresos");
    cargarDetalle({ tipo: "egresos", inicio: fechaInicio, fin: fechaFin, titulo: `${fechaInicio} a ${fechaFin}` });
  };

  if (!usuario || usuario.rol !== "admin") {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Estadísticas</h1>
          <p className="mt-1 text-sm text-gray-600">Panel financiero y operativo del colegio</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={cargarDatosIniciales}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-800"
          >
            Actualizar
          </button>
        </div>
      </div>

      <ResumenFinanciero
        stats={stats}
        onVerIngresosHoy={verIngresosHoy}
        onVerEgresosHoy={verEgresosHoy}
        onVerEgresosAcumulados={verEgresosAcumulados}
      />

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MovimientoMensual
          mesesFinancieros={mesesFinancieros}
          onVerIngresosMes={verIngresosMes}
          onVerEgresosMes={verEgresosMes}
        />

        <RangoFechasPanel
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onCambiarFechaInicio={setFechaInicio}
          onCambiarFechaFin={setFechaFin}
          onConsultarIngresos={consultarIngresosPorRango}
          onConsultarEgresos={consultarEgresosPorRango}
          loadingDetalle={loadingDetalle}
          estudiantesPorCurso={estudiantesPorCurso}
        />
      </div>

      {detalle && (
        <DetalleReportes
          ref={detalleRef}
          detalleTipo={detalleTipo}
          detalleTitulo={detalleTitulo}
          loadingDetalle={loadingDetalle}
          filtroMedioIngreso={filtroMedioIngreso}
          onCambiarFiltroMedioIngreso={setFiltroMedioIngreso}
          onCerrar={() => setDetalle(null)}
          detalleEgresos={detalleEgresos}
          detalleIngresosFiltrados={detalleIngresosFiltrados}
          totalDetalleIngresos={totalDetalleIngresos}
          totalDetalleEgresos={totalDetalleEgresos}
        />
      )}
    </div>
  );
}

export default ReportesAdmin;
