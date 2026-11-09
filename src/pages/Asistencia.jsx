import { useCallback, useEffect, useState } from "react";
import AvisoSinClaseElegida from "../components/AvisoSinClaseElegida";
import EncabezadoContextoCurso from "../components/EncabezadoContextoCurso";
import SelectorClaseTrabajo from "../components/SelectorClaseTrabajo";
import AvisoRegistroAsistencia from "../components/asistencia/AvisoRegistroAsistencia";
import BarraGuardadoAsistencia from "../components/asistencia/BarraGuardadoAsistencia";
import CampoFechaAsistencia from "../components/asistencia/CampoFechaAsistencia";
import PanelAsistenciaProfesor from "../components/asistencia/PanelAsistenciaProfesor";
import useClaseAsistenciaProfesor from "../hooks/asistencia/useClaseAsistenciaProfesor";
import useComandosAsistenciaProfesor from "../hooks/asistencia/useComandosAsistenciaProfesor";
import useConsultasAsistenciaProfesor from "../hooks/asistencia/useConsultasAsistenciaProfesor";
import { fechaIsoColombia } from "../utils/fechaColombia";

const AYUDA_PREESCOLAR =
  "En preescolar la asistencia se toma una vez al día, con «Asistencia diaria».";

// La asistencia de una clase, un período y una fecha. La página la vuelve a
// montar (con `key`) al cambiar de clase o de período: así no queda nada
// marcado de la clase anterior.
function AsistenciaDeLaClase({ asignacionId, periodo, fecha, onClaseNoDisponible, onCambiosPendientes }) {
  const {
    estudiantes,
    historial,
    cargandoHistorial,
    historialListo,
    errorHistorial,
    cargarHistorial,
  } = useConsultasAsistenciaProfesor({
    asignacionId,
    periodo,
    habilitado: true,
    onClaseNoDisponible,
  });

  const {
    asistencia,
    historialPorEstudiante,
    asistenciaGuardadaHoy,
    asistenciaDelDiaTomada,
    resumenAsistencia,
    hayCambiosSinGuardar,
    puedeInteractuar,
    puedeGuardar,
    marcar,
    marcarTodosPresentes,
    restaurarSeleccion,
    guardarAsistencia,
  } = useComandosAsistenciaProfesor({
    asignacionId,
    periodo,
    fecha,
    estudiantes,
    historial,
    historialListo,
    errorHistorial,
    recargarHistorial: cargarHistorial,
  });

  useEffect(() => {
    onCambiosPendientes(hayCambiosSinGuardar);
  }, [hayCambiosSinGuardar, onCambiosPendientes]);

  useEffect(() => () => onCambiosPendientes(false), [onCambiosPendientes]);

  return (
    <>
      <AvisoRegistroAsistencia
        visible={asistenciaDelDiaTomada}
        hayCambiosSinGuardar={hayCambiosSinGuardar}
        cantidadGuardada={asistenciaGuardadaHoy.size}
        totalEstudiantes={estudiantes.length}
      />

      <PanelAsistenciaProfesor
        estudiantes={estudiantes}
        historialPorEstudiante={historialPorEstudiante}
        asistencia={asistencia}
        cargandoHistorial={cargandoHistorial}
        historialListo={historialListo}
        errorHistorial={errorHistorial}
        puedeInteractuar={puedeInteractuar}
        hayCambiosSinGuardar={hayCambiosSinGuardar}
        asistenciaDelDiaTomada={asistenciaDelDiaTomada}
        resumenAsistencia={resumenAsistencia}
        onReintentarHistorial={cargarHistorial}
        onMarcarTodosPresentes={marcarTodosPresentes}
        onRestaurarSeleccion={restaurarSeleccion}
        onMarcar={marcar}
      />

      <BarraGuardadoAsistencia
        resumenAsistencia={resumenAsistencia}
        hayCambiosSinGuardar={hayCambiosSinGuardar}
        asistenciaDelDiaTomada={asistenciaDelDiaTomada}
        puedeGuardar={puedeGuardar}
        onGuardar={guardarAsistencia}
      />
    </>
  );
}

function Asistencia() {
  const profesorStorage = localStorage.getItem("profesor");
  const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
  const profesorId = profesor?.id;

  // Siempre arranca en hoy; cambiarla es opcional y no se recuerda.
  const hoy = fechaIsoColombia();
  const [fecha, setFecha] = useState(hoy);

  const {
    opciones,
    cargandoClases,
    errorClases,
    reintentarClases,
    asignacionEfectiva,
    cambiarAsignacion,
    descartarAsignacion,
    periodo,
    cambiarPeriodo,
    confirmarCambio,
    informarCambiosPendientes,
    esPreescolar,
    sinClase,
  } = useClaseAsistenciaProfesor(profesorId);

  useEffect(() => {
    if (!profesorId) window.location.href = "/login";
  }, [profesorId]);

  const cambiarFecha = async (valor) => {
    if (valor === fecha) return;
    if (await confirmarCambio()) setFecha(valor);
  };

  const manejarClaseNoDisponible = useCallback(() => descartarAsignacion(), [descartarAsignacion]);

  return (
    <div className="w-full p-4 sm:p-6 md:p-8">
      <EncabezadoContextoCurso
        titulo="Gestión de asistencia"
        etiqueta="Control diario"
        descripcion="Registra la asistencia y acompaña el seguimiento de tus estudiantes."
        tituloContexto="¿De qué clase vas a tomar asistencia?"
        subtituloContexto="La fecha es la de hoy. Cámbiala solo si vas a registrar otro día."
        controles={
          <SelectorClaseTrabajo
            idPrefijo="asistencia"
            opciones={opciones}
            asignacionId={asignacionEfectiva}
            onCambiarAsignacion={cambiarAsignacion}
            cargando={cargandoClases}
            error={errorClases}
            onReintentar={reintentarClases}
            ayudaClase={esPreescolar ? AYUDA_PREESCOLAR : ""}
            periodo={periodo}
            onCambiarPeriodo={cambiarPeriodo}
          >
            <CampoFechaAsistencia value={fecha} hoy={hoy} onChange={cambiarFecha} />
          </SelectorClaseTrabajo>
        }
      />

      {asignacionEfectiva ? (
        <AsistenciaDeLaClase
          key={`${asignacionEfectiva}|${periodo}`}
          asignacionId={asignacionEfectiva}
          periodo={periodo}
          fecha={fecha}
          onClaseNoDisponible={manejarClaseNoDisponible}
          onCambiosPendientes={informarCambiosPendientes}
        />
      ) : (
        <AvisoSinClaseElegida
          titulo={sinClase?.titulo}
          texto={sinClase?.texto}
          cargando={cargandoClases}
        />
      )}
    </div>
  );
}

export default Asistencia;
