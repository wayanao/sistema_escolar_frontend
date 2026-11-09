import { useCallback, useEffect, useState } from "react";
import AvisoSinClaseElegida from "../components/AvisoSinClaseElegida";
import SelectorClaseTrabajo from "../components/SelectorClaseTrabajo";
import AccionesMallaCurricular from "../components/mallaCurricular/AccionesMallaCurricular";
import EditorMallaCurricular from "../components/mallaCurricular/EditorMallaCurricular";
import EncabezadoMallaCurricular from "../components/mallaCurricular/EncabezadoMallaCurricular";
import { CargandoMallaCurricular } from "../components/mallaCurricular/EstadosMallaCurricular";
import TraerPlaneadorAnioAnteriorView from "../components/mallaCurricular/TraerPlaneadorAnioAnteriorView";
import VistaImprimibleMallaCurricular from "../components/mallaCurricular/VistaImprimibleMallaCurricular";
import { obtenerEstadoVisualMallaCurricular } from "../components/mallaCurricular/estadoVisualMallaCurricular";
import useClasePlaneadorProfesor from "../hooks/mallaCurricular/useClasePlaneadorProfesor";
import { useComandosMallaCurricular } from "../hooks/mallaCurricular/useComandosMallaCurricular";
import { useConsultasMallaCurricular } from "../hooks/mallaCurricular/useConsultasMallaCurricular";
import { usePlaneadorAnioAnterior } from "../hooks/mallaCurricular/usePlaneadorAnioAnterior";

// El planeador de una clase. La página lo vuelve a montar (con `key`) al
// cambiar de clase; el período sí cambia aquí dentro, como siempre, para no
// volver a preguntar si se puede traer el planeador del año pasado.
function PlaneadorDeLaClase({ asignacionId, asignacion, periodo, selector, onCambiosPendientes }) {
  const [vistaImpresion, setVistaImpresion] = useState(false);

  const {
    cambiarCampoPlaneador,
    estadoGuardado,
    guardando,
    guardarPlaneadores,
    manejarErrorPlaneadores,
    manejarInicioPlaneadores,
    manejarPlaneadoresCargados,
    planeadores,
  } = useComandosMallaCurricular({ asignacionId });

  const {
    alCargarPeriodo,
    puedeTraer,
    traer,
    trayendo,
  } = usePlaneadorAnioAnterior({ asignacionId });

  const manejarPeriodoCargado = useCallback((resultado) => {
    manejarPlaneadoresCargados(resultado);
    alCargarPeriodo(resultado.conFilas);
  }, [alCargarPeriodo, manejarPlaneadoresCargados]);

  const {
    cargarPlaneadores,
    loading,
  } = useConsultasMallaCurricular({
    asignacionId,
    periodo,
    onErrorPlaneadores: manejarErrorPlaneadores,
    onInicioPlaneadores: manejarInicioPlaneadores,
    onPlaneadoresCargados: manejarPeriodoCargado,
  });

  // Lo escrito sin guardar se pierde al cambiar de clase o de período: la
  // página pregunta antes.
  const hayCambiosSinGuardar = Boolean(estadoGuardado.modificado);
  useEffect(() => {
    onCambiosPendientes(hayCambiosSinGuardar);
  }, [hayCambiosSinGuardar, onCambiosPendientes]);

  useEffect(() => () => onCambiosPendientes(false), [onCambiosPendientes]);

  const handleGuardarPlaneadores = () => guardarPlaneadores({
    periodo,
    recargarPlaneadores: cargarPlaneadores,
  });

  // Año lectivo, paso 7.3. Con algo escrito sin guardar, el botón se esconde:
  // traer recarga el periodo y borraría lo que se está escribiendo.
  const mostrarTraer = puedeTraer && !estadoGuardado.cargando && !estadoGuardado.modificado;

  if (loading) return <CargandoMallaCurricular />;

  if (vistaImpresion) {
    return (
      <VistaImprimibleMallaCurricular
        asignacion={asignacion}
        onRegresar={() => setVistaImpresion(false)}
        periodo={periodo}
        planeadores={planeadores}
      />
    );
  }

  const estadoVisual = obtenerEstadoVisualMallaCurricular({
    estadoGuardado,
    loading,
  });

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <EncabezadoMallaCurricular selector={selector} estadoVisual={estadoVisual} />
      {mostrarTraer && (
        <TraerPlaneadorAnioAnteriorView
          onTraer={() => traer({ recargarPlaneadores: cargarPlaneadores })}
          trayendo={trayendo}
        />
      )}
      <EditorMallaCurricular
        onCampoChange={cambiarCampoPlaneador}
        periodo={periodo}
        planeadores={planeadores}
      />
      <AccionesMallaCurricular
        cargando={estadoGuardado.cargando}
        estadoVisual={estadoVisual}
        guardando={guardando}
        onGuardar={handleGuardarPlaneadores}
        onImprimir={() => setVistaImpresion(true)}
      />
    </div>
  );
}

function PlaneadorAnual() {
  const profesor = JSON.parse(localStorage.getItem("profesor") || "null");
  const profesorId = profesor?.id;

  const {
    opciones,
    cargandoClases,
    errorClases,
    reintentarClases,
    asignacionEfectiva,
    claseSeleccionada,
    cambiarAsignacion,
    periodo,
    cambiarPeriodo,
    informarCambiosPendientes,
    sinClase,
  } = useClasePlaneadorProfesor(profesorId);

  const selector = (
    <SelectorClaseTrabajo
      idPrefijo="planeador"
      opciones={opciones}
      asignacionId={asignacionEfectiva}
      onCambiarAsignacion={cambiarAsignacion}
      cargando={cargandoClases}
      error={errorClases}
      onReintentar={reintentarClases}
      periodo={periodo}
      onCambiarPeriodo={cambiarPeriodo}
    />
  );

  if (!asignacionEfectiva) {
    return (
      <div className="min-h-screen p-3 sm:p-6">
        <EncabezadoMallaCurricular selector={selector} />
        <AvisoSinClaseElegida
          titulo={sinClase?.titulo}
          texto={sinClase?.texto}
          cargando={cargandoClases}
        />
      </div>
    );
  }

  return (
    <PlaneadorDeLaClase
      key={asignacionEfectiva}
      asignacionId={asignacionEfectiva}
      asignacion={claseSeleccionada}
      periodo={periodo}
      selector={selector}
      onCambiosPendientes={informarCambiosPendientes}
    />
  );
}

export default PlaneadorAnual;
