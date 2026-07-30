import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import DetallePlaneacionAdmin from "../components/planeaciones/admin/DetallePlaneacionAdmin";
import EncabezadoPlaneacionesAdmin from "../components/planeaciones/admin/EncabezadoPlaneacionesAdmin";
import FiltrosPlaneacionesAdmin from "../components/planeaciones/admin/FiltrosPlaneacionesAdmin";
import ResultadosPlaneacionesAdmin from "../components/planeaciones/admin/ResultadosPlaneacionesAdmin";
import useDetallePlaneacionAdmin from "../hooks/planeaciones/useDetallePlaneacionAdmin";
import useListadoPlaneacionesAdmin from "../hooks/planeaciones/useListadoPlaneacionesAdmin";

function subirAlInicio() {
  const reducirMovimiento = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  window.requestAnimationFrame(() => {
    window.scrollTo({
      top: 0,
      behavior: reducirMovimiento ? "auto" : "smooth",
    });
  });
}

function PlaneadoresClasesAdmin() {
  const { planId } = useParams();
  return planId ? (
    <DetallePlaneadorAdmin planId={planId} />
  ) : (
    <ListadoPlaneadoresAdmin />
  );
}

function ListadoPlaneadoresAdmin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    profesores,
    planes,
    total,
    vista,
    estado,
    pagina,
    filtros,
    filtrosAplicados,
    cargando,
    conteoPendientes,
    error,
    seleccionCompleta,
    totalPaginas,
    desde,
    hasta,
    queryActual,
    cambiarVista,
    cambiarEstado,
    cambiarPagina,
    cambiarProfesor,
    cambiarBusqueda,
    limpiarBusqueda,
    limpiarFiltros,
  } = useListadoPlaneacionesAdmin({
    searchParams,
    setSearchParams,
  });

  const abrirPlan = (id) => {
    const query = queryActual.toString();
    navigate(
      `/admin/planeadores-clases/${id}${query ? `?${query}` : ""}`,
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-1 sm:py-3">
      <div className="space-y-5">
        <EncabezadoPlaneacionesAdmin
          vista={vista}
          onCambiarVista={cambiarVista}
        />

        <FiltrosPlaneacionesAdmin
          profesores={profesores}
          profesorId={filtros.profesor_id}
          estado={estado}
          conteoPendientes={conteoPendientes}
          onCambiarProfesor={cambiarProfesor}
          onCambiarEstado={cambiarEstado}
        />

        <ResultadosPlaneacionesAdmin
          planes={planes}
          total={total}
          vista={vista}
          estado={estado}
          pagina={pagina}
          busqueda={filtros.busqueda}
          busquedaAplicada={filtrosAplicados.busqueda}
          cargando={cargando}
          error={error}
          seleccionCompleta={seleccionCompleta}
          totalPaginas={totalPaginas}
          desde={desde}
          hasta={hasta}
          onCambiarBusqueda={cambiarBusqueda}
          onLimpiarBusqueda={limpiarBusqueda}
          onLimpiarFiltros={limpiarFiltros}
          onCambiarPagina={cambiarPagina}
          onAbrirPlan={abrirPlan}
        />
      </div>
    </div>
  );
}

function DetallePlaneadorAdmin({ planId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    plan,
    observaciones,
    observacion,
    setObservacion,
    cargando,
    accionRevision,
    mensaje,
    marcarRevisado,
    guardarObservacion,
    eliminandoImagen,
    eliminarImagen,
  } = useDetallePlaneacionAdmin({
    planId,
    onSubirInicio: subirAlInicio,
  });

  const volver = () => {
    const query = searchParams.toString();
    navigate(`/admin/planeadores-clases${query ? `?${query}` : ""}`);
  };

  return (
    <DetallePlaneacionAdmin
      plan={plan}
      observaciones={observaciones}
      observacion={observacion}
      cargando={cargando}
      accionRevision={accionRevision}
      mensaje={mensaje}
      eliminandoImagen={eliminandoImagen}
      onVolver={volver}
      onCambiarObservacion={setObservacion}
      onAprobar={marcarRevisado}
      onSolicitarAjuste={guardarObservacion}
      onEliminarImagen={eliminarImagen}
    />
  );
}

export default PlaneadoresClasesAdmin;
