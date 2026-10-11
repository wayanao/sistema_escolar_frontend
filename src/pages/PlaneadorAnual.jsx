import { useCallback, useState } from "react";
import AccionesMallaCurricular from "../components/mallaCurricular/AccionesMallaCurricular";
import EditorMallaCurricular from "../components/mallaCurricular/EditorMallaCurricular";
import EncabezadoMallaCurricular from "../components/mallaCurricular/EncabezadoMallaCurricular";
import {
  CargandoMallaCurricular,
  SinAsignacionMallaCurricular,
} from "../components/mallaCurricular/EstadosMallaCurricular";
import TraerPlaneadorAnioAnteriorView from "../components/mallaCurricular/TraerPlaneadorAnioAnteriorView";
import VistaImprimibleMallaCurricular from "../components/mallaCurricular/VistaImprimibleMallaCurricular";
import { obtenerEstadoVisualMallaCurricular } from "../components/mallaCurricular/estadoVisualMallaCurricular";
import { useComandosMallaCurricular } from "../hooks/mallaCurricular/useComandosMallaCurricular";
import { useConsultasMallaCurricular } from "../hooks/mallaCurricular/useConsultasMallaCurricular";
import { usePlaneadorAnioAnterior } from "../hooks/mallaCurricular/usePlaneadorAnioAnterior";

function PlaneadorAnual() {
  const [vistaImpresion, setVistaImpresion] = useState(false);

  const asignacionId = localStorage.getItem("asignacionId");
  const profesor = JSON.parse(localStorage.getItem("profesor") || "null");
  const profesorId = profesor?.id;

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
    asignacion,
    cambiarPeriodo,
    cargarPlaneadores,
    loading,
    periodo,
  } = useConsultasMallaCurricular({
    asignacionId,
    profesorId,
    onErrorPlaneadores: manejarErrorPlaneadores,
    onInicioPlaneadores: manejarInicioPlaneadores,
    onPlaneadoresCargados: manejarPeriodoCargado,
  });

  const handleGuardarPlaneadores = () => guardarPlaneadores({
    periodo,
    recargarPlaneadores: cargarPlaneadores,
  });

  // Año lectivo, paso 7.3. Con algo escrito sin guardar, el botón se esconde:
  // traer recarga el periodo y borraría lo que se está escribiendo.
  const mostrarTraer = puedeTraer && !estadoGuardado.cargando && !estadoGuardado.modificado;

  if (loading) return <CargandoMallaCurricular />;
  if (!asignacionId) return <SinAsignacionMallaCurricular />;

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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <EncabezadoMallaCurricular
        asignacion={asignacion}
        estadoVisual={estadoVisual}
        onPeriodoChange={cambiarPeriodo}
        periodo={periodo}
      />
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

export default PlaneadorAnual;
