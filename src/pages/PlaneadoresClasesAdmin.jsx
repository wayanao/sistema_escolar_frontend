import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import DetallePlaneacionAdmin from "../components/planeaciones/admin/DetallePlaneacionAdmin";
import EncabezadoPlaneacionesAdmin from "../components/planeaciones/admin/EncabezadoPlaneacionesAdmin";
import FiltrosPlaneacionesAdmin from "../components/planeaciones/admin/FiltrosPlaneacionesAdmin";
import ResultadosPlaneacionesAdmin from "../components/planeaciones/admin/ResultadosPlaneacionesAdmin";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useDetallePlaneacionAdmin from "../hooks/planeaciones/useDetallePlaneacionAdmin";
import useListadoPlaneacionesAdmin from "../hooks/planeaciones/useListadoPlaneacionesAdmin";
import useRevisionMasivaPlaneacionesAdmin from "../hooks/planeaciones/useRevisionMasivaPlaneacionesAdmin";

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
  const { parametros, permisos } = useAnioLectivo();
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
    conteoVistos,
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
    recargar,
  } = useListadoPlaneacionesAdmin({
    searchParams,
    setSearchParams,
    parametrosAnio: parametros,
  });
  const {
    seleccionados,
    idsMarcables,
    marcando,
    progreso,
    resumen,
    alternar,
    alternarTodos,
    marcarComoVistos,
  } = useRevisionMasivaPlaneacionesAdmin({
    planes,
    onMarcados: recargar,
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
          conteoVistos={conteoVistos}
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
          seleccionados={seleccionados}
          // En un año cerrado, solo consulta: sin casillas ni "Marcar como
          // vistos" (marcar es guardar una revisión).
          idsMarcables={permisos.puedeEditar ? idsMarcables : []}
          marcando={marcando}
          progreso={progreso}
          resumen={resumen}
          onAlternarPlan={permisos.puedeEditar ? alternar : undefined}
          onAlternarTodos={alternarTodos}
          onMarcarVistos={marcarComoVistos}
        />
      </div>
    </div>
  );
}

function DetallePlaneadorAdmin({ planId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // El detalle parte del id del plan y no trae su año: los botones siguen el
  // año que mira el admin. Si no coincidieran, el backend responde su 409 y el
  // detalle muestra el mensaje.
  const { permisos } = useAnioLectivo();
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
      puedeEditar={permisos.puedeEditar}
      onVolver={volver}
      onCambiarObservacion={setObservacion}
      onAprobar={marcarRevisado}
      onSolicitarAjuste={guardarObservacion}
      onEliminarImagen={eliminarImagen}
    />
  );
}

export default PlaneadoresClasesAdmin;
