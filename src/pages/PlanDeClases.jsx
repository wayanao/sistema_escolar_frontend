import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ConfiguracionPlanProfesor from "../components/planeaciones/profesor/ConfiguracionPlanProfesor";
import EncabezadoPlanProfesor from "../components/planeaciones/profesor/EncabezadoPlanProfesor";
import GuiaDidacticaProfesor from "../components/planeaciones/profesor/GuiaDidacticaProfesor";
import GuardadoPlanProfesor from "../components/planeaciones/profesor/GuardadoPlanProfesor";
import HistorialPlanesProfesor from "../components/planeaciones/profesor/HistorialPlanesProfesor";
import PresentacionClaseProfesor from "../components/planeaciones/profesor/PresentacionClaseProfesor";
import SeguimientoPlanProfesor from "../components/planeaciones/profesor/SeguimientoPlanProfesor";
import useCargaPlanDiarioProfesor from "../hooks/planeaciones/useCargaPlanDiarioProfesor";
import useClasesPlaneacionProfesor from "../hooks/planeaciones/useClasesPlaneacionProfesor";
import useEliminacionImagenPlanProfesor from "../hooks/planeaciones/useEliminacionImagenPlanProfesor";
import useFormularioPlaneacionProfesor from "../hooks/planeaciones/useFormularioPlaneacionProfesor";
import useGuardadoPlaneacionProfesor from "../hooks/planeaciones/useGuardadoPlaneacionProfesor";
import useHistorialPlaneacionesProfesor from "../hooks/planeaciones/useHistorialPlaneacionesProfesor";
import useSeguimientoPlaneacionProfesor from "../hooks/planeaciones/useSeguimientoPlaneacionProfesor";
import { fechaIsoColombia } from "../utils/fechaColombia";
import { obtenerEstadoGuardadoVisual } from "../utils/planeaciones/profesor";

function subirAlInicio() {
  const reducirMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: reducirMovimiento ? "auto" : "smooth" });
  });
}

function PlanDeClases() {
  const profesorStorage = localStorage.getItem("profesor");
  const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
  const profesorId = profesor?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const asignacionDesdeUrl = searchParams.get("asignacion_id") || "";
  const fechaDesdeUrl = searchParams.get("fecha") || "";

  const [planActualId, setPlanActualId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [avisoGuardadoId, setAvisoGuardadoId] = useState(0);
  const [presentacionAbierta, setPresentacionAbierta] = useState(false);
  const presentacionAutomaticaPendienteRef = useRef(searchParams.get("presentacion") === "1");
  const {
    asignacionId,
    setAsignacionId,
    claseSeleccionada: selectedClase,
    clasesUnicas,
    cargandoClases,
  } = useClasesPlaneacionProfesor({
    profesorId,
    asignacionInicial:
      asignacionDesdeUrl || localStorage.getItem("asignacionId") || "",
    onError: setMensaje,
  });
  const {
    periodo,
    fecha,
    form,
    imagenes,
    imagenesGuardadas,
    imagenesSeleccionadas,
    estadoGuardado,
    setFecha,
    actualizarCampo,
    actualizarPeriodo,
    manejarImagen,
    registrarInputImagen,
    iniciarCarga,
    cargarDesdePlan,
    prepararPlanNuevo,
    marcarCargaFallida,
    marcarGuardado,
    actualizarImagenGuardada,
    recordarCampos,
  } = useFormularioPlaneacionProfesor({
    profesorId,
    asignacionId,
    fechaInicial: fechaDesdeUrl || fechaIsoColombia(),
  });
  const {
    historial,
    pagina: historialPagina,
    hayMas: historialHayMas,
    cargando: cargandoHistorial,
    error: errorHistorial,
    pageSize: historialPageSize,
    cargarHistorial,
    actualizarPlanHistorial,
  } = useHistorialPlaneacionesProfesor(asignacionId);
  const {
    seguimiento,
    observaciones,
    observacionesAbiertas,
    cargandoObservaciones,
    errorObservaciones,
    alternarObservaciones,
    actualizarSeguimientoDesdePlan,
  } = useSeguimientoPlaneacionProfesor({
    planActualId,
    actualizarPlanHistorial,
    searchParams,
    setSearchParams,
  });

  const manejarInicioCargaPlan = useCallback(() => {
    actualizarSeguimientoDesdePlan(null);
    iniciarCarga();
  }, [actualizarSeguimientoDesdePlan, iniciarCarga]);

  const manejarPlanCargado = useCallback((plan) => {
    if (plan) {
      setPlanActualId(plan.id);
      actualizarSeguimientoDesdePlan(plan);
      cargarDesdePlan(plan);
      setMensaje("Plan cargado para esta fecha.");

      if (presentacionAutomaticaPendienteRef.current) {
        presentacionAutomaticaPendienteRef.current = false;
        setPresentacionAbierta(true);
      }
      return;
    }

    setPlanActualId(null);
    actualizarSeguimientoDesdePlan(null);
    prepararPlanNuevo();
    setMensaje("");
  }, [actualizarSeguimientoDesdePlan, cargarDesdePlan, prepararPlanNuevo]);

  const manejarErrorCargaPlan = useCallback((requestError) => {
    console.error("Error cargando plan del día", requestError);
    marcarCargaFallida();
    setMensaje("No se pudo cargar el plan de esta fecha.");
    actualizarSeguimientoDesdePlan(null);
  }, [actualizarSeguimientoDesdePlan, marcarCargaFallida]);

  const {
    cargando,
    cargarPlanDelDia,
  } = useCargaPlanDiarioProfesor({
    asignacionId,
    fecha,
    onInicio: manejarInicioCargaPlan,
    onCargado: manejarPlanCargado,
    onError: manejarErrorCargaPlan,
  });
  const recargarPlaneacion = useCallback(
    () => Promise.all([cargarPlanDelDia(), cargarHistorial()]),
    [cargarHistorial, cargarPlanDelDia],
  );
  const eliminarImagenGuardada = useEliminacionImagenPlanProfesor({
    planActualId,
    actualizarImagenGuardada,
    actualizarPlanHistorial,
    recargarPlaneacion,
    marcarGuardado,
    onMensaje: setMensaje,
  });
  const confirmarGuardado = useCallback(() => {
    setAvisoGuardadoId((actual) => actual + 1);
  }, []);
  const abrirPlanHistorial = useCallback((fechaPlan) => {
    setFecha(fechaPlan);
    subirAlInicio();
  }, [setFecha]);
  const {
    guardando,
    guardarPlan,
  } = useGuardadoPlaneacionProfesor({
    asignacionId,
    periodo,
    fecha,
    form,
    imagenes,
    planActualId,
    versionRevision: seguimiento?.version_revision,
    recordarCampos,
    marcarGuardado,
    recargarPlaneacion,
    onPlanIdActualizado: setPlanActualId,
    onMensaje: setMensaje,
    onConfirmacionGuardado: confirmarGuardado,
    onSubirInicio: subirAlInicio,
  });

  useEffect(() => {
    const asignacionSolicitada = searchParams.get("asignacion_id");
    const fechaSolicitada = searchParams.get("fecha");
    if (asignacionSolicitada) setAsignacionId(asignacionSolicitada);
    if (fechaSolicitada) setFecha(fechaSolicitada);
  }, [searchParams, setAsignacionId, setFecha]);

  useEffect(() => {
    if (!profesorId) {
      window.location.href = "/login";
    }
  }, [profesorId]);

  const estadoVisual = obtenerEstadoGuardadoVisual(estadoGuardado, cargando);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-amber-50/50 p-2 sm:p-6">
      <div className="space-y-6">
        <EncabezadoPlanProfesor
          estadoVisual={estadoVisual}
          avisoGuardadoId={avisoGuardadoId}
          planActualId={planActualId}
        />

        <ConfiguracionPlanProfesor
          asignacionId={asignacionId}
          clases={clasesUnicas}
          cargandoClases={cargandoClases}
          periodo={periodo}
          fecha={fecha}
          onCambiarAsignacion={setAsignacionId}
          onCambiarPeriodo={actualizarPeriodo}
          onCambiarFecha={setFecha}
        />

        {planActualId && seguimiento && (
          <SeguimientoPlanProfesor
            seguimiento={seguimiento}
            observaciones={observaciones}
            abierto={observacionesAbiertas}
            cargando={cargandoObservaciones}
            error={errorObservaciones}
            onAlternar={alternarObservaciones}
          />
        )}

        <div className="space-y-6">
          <GuiaDidacticaProfesor
            asignacion={selectedClase}
            cargando={cargandoClases || cargando}
            form={form}
            imagenesSeleccionadas={imagenesSeleccionadas}
            imagenesGuardadas={imagenesGuardadas}
            onActualizarCampo={actualizarCampo}
            onRegistrarInputImagen={registrarInputImagen}
            onManejarImagen={manejarImagen}
            onEliminarImagen={eliminarImagenGuardada}
            onAbrirPresentacion={() => setPresentacionAbierta(true)}
          />

          <GuardadoPlanProfesor
            guardando={guardando}
            cargando={cargando}
            buttonText={estadoVisual.buttonText}
            mensaje={mensaje}
            onGuardar={guardarPlan}
          />
        </div>

        <HistorialPlanesProfesor
          asignacionId={asignacionId}
          fechaActiva={fecha}
          planes={historial}
          pagina={historialPagina}
          hayMas={historialHayMas}
          cargando={cargandoHistorial}
          error={errorHistorial}
          pageSize={historialPageSize}
          onCargarPagina={cargarHistorial}
          onAbrirPlan={abrirPlanHistorial}
        />

        {presentacionAbierta && selectedClase && (
          <PresentacionClaseProfesor
            asignacion={selectedClase}
            periodo={periodo}
            fecha={fecha}
            form={form}
            imagenesSeleccionadas={imagenesSeleccionadas}
            imagenesGuardadas={imagenesGuardadas}
            hayCambios={estadoGuardado.modificado}
            onCerrar={() => setPresentacionAbierta(false)}
          />
        )}
      </div>
    </div>
  );
}

export default PlanDeClases;
