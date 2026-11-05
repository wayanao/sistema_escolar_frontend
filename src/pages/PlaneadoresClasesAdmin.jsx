import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import DetallePlaneacionAdmin from "../components/planeaciones/admin/DetallePlaneacionAdmin";
import EncabezadoPlaneacionesAdmin from "../components/planeaciones/admin/EncabezadoPlaneacionesAdmin";
import FiltrosPlaneacionesAdmin from "../components/planeaciones/admin/FiltrosPlaneacionesAdmin";
import ResultadosPlaneacionesAdmin from "../components/planeaciones/admin/ResultadosPlaneacionesAdmin";
import VentanaCuadrosPlanAdmin from "../components/planeaciones/admin/VentanaCuadrosPlanAdmin";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useCuadrosPlan from "../hooks/planeaciones/useCuadrosPlan";
import useDetallePlaneacionAdmin from "../hooks/planeaciones/useDetallePlaneacionAdmin";
import useEdicionCuadrosPlanAdmin from "../hooks/planeaciones/useEdicionCuadrosPlanAdmin";
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
  // Nombres de los cuadros del plan (docs/funcionalidades/NOMBRES_CUADROS_PLAN.md):
  // los usa el detalle y los edita la ventana de la bandeja. Se leen aquí, una
  // vez, y no en cada plan que se abre.
  const cuadrosPlan = useCuadrosPlan();
  return planId ? (
    <DetallePlaneadorAdmin planId={planId} cuadros={cuadrosPlan.cuadros} />
  ) : (
    <ListadoPlaneadoresAdmin cuadrosPlan={cuadrosPlan} />
  );
}

function ListadoPlaneadoresAdmin({ cuadrosPlan }) {
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
  // Los nombres son del colegio, no de un año: se renombran también mirando
  // un año cerrado.
  const edicionCuadros = useEdicionCuadrosPlanAdmin({
    cuadros: cuadrosPlan.cuadros,
    disponible: !cuadrosPlan.cargando && !cuadrosPlan.error,
    onGuardados: cuadrosPlan.reemplazar,
  });

  const abrirPlan = (id) => {
    const query = queryActual.toString();
    navigate(
      `/admin/planeadores-clases/${id}${query ? `?${query}` : ""}`,
    );
  };

  return (
    <div className="min-h-screen py-1 sm:py-3">
      <div className="space-y-5">
        <EncabezadoPlaneacionesAdmin
          vista={vista}
          onCambiarVista={cambiarVista}
          onAbrirNombresCuadros={edicionCuadros.abrir}
          avisoNombresCuadros={edicionCuadros.aviso}
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

      {edicionCuadros.abierta && (
        <VentanaCuadrosPlanAdmin
          cuadros={cuadrosPlan.cuadros}
          valores={edicionCuadros.valores}
          errores={edicionCuadros.errores}
          error={edicionCuadros.error}
          cargando={cuadrosPlan.cargando}
          errorLectura={cuadrosPlan.error}
          guardando={edicionCuadros.guardando}
          onCambiar={edicionCuadros.cambiar}
          onVolverAOriginales={edicionCuadros.volverAOriginales}
          onGuardar={edicionCuadros.guardar}
          onReintentar={cuadrosPlan.recargar}
          onCerrar={edicionCuadros.cerrar}
        />
      )}
    </div>
  );
}

function DetallePlaneadorAdmin({ planId, cuadros }) {
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
      cuadros={cuadros}
      onVolver={volver}
      onCambiarObservacion={setObservacion}
      onAprobar={marcarRevisado}
      onSolicitarAjuste={guardarObservacion}
      onEliminarImagen={eliminarImagen}
    />
  );
}

export default PlaneadoresClasesAdmin;
