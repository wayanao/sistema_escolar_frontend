import { useNavigate } from "react-router-dom";
import ContextoTrabajoProfesor from "../components/dashboards/profesor/ContextoTrabajoProfesor";
import CumpleanosSemana from "../components/dashboards/CumpleanosSemana";
import FiltroRendimiento from "../components/dashboards/profesor/FiltroRendimiento";
import HorarioSemanal from "../components/dashboards/profesor/HorarioSemanal";
import TarjetaBajoRendimiento from "../components/dashboards/profesor/TarjetaBajoRendimiento";
import TarjetaInasistencias from "../components/dashboards/profesor/TarjetaInasistencias";
import TarjetaMejorRendimiento from "../components/dashboards/profesor/TarjetaMejorRendimiento";
import useClasesProfesor from "../hooks/dashboards/useClasesProfesor";
import useContextoProfesor from "../hooks/dashboards/useContextoProfesor";
import useCumpleanosProfesor from "../hooks/dashboards/useCumpleanosProfesor";
import useInasistenciasProfesor from "../hooks/dashboards/useInasistenciasProfesor";
import usePlaneacionesRecientes from "../hooks/dashboards/usePlaneacionesRecientes";
import useRendimientoProfesor from "../hooks/dashboards/useRendimientoProfesor";
import { RUTA_RANKING_BAJO, RUTA_RANKING_MEJOR } from "../utils/dashboards/profesor";

function DashboardProfesor() {
  const navigate = useNavigate();
  const {
    profesorId,
    nombreProfesor,
    asignacionId,
    periodo,
    fecha,
    cambiarAsignacion,
    cambiarPeriodo,
    cambiarFecha,
    descartarAsignacionInvalida,
    exigirClaseElegida,
  } = useContextoProfesor();

  const {
    loadingClases,
    clasesUnicas,
    claseSeleccionada,
    cursosProfesor,
    clasesConHorario,
    clasesPorJornada,
    horarioPorJornada,
    filtroJornada,
    setFiltroJornada,
    hayDosJornadas,
    jornadasVisibles,
  } = useClasesProfesor(profesorId, asignacionId, descartarAsignacionInvalida);

  const { inasistencias, loadingInasistencias } = useInasistenciasProfesor(profesorId);

  const { cumpleanos, loadingCumpleanos, errorCumpleanos, diasRangoCumpleanos } =
    useCumpleanosProfesor(profesorId);

  const {
    cursoFiltro,
    materiaFiltro,
    materiasDelCurso,
    cursoFiltroNombre,
    materiaFiltroNombre,
    notasBajas,
    notasAltas,
    loadingRendimiento,
    cambiarCurso,
    setMateriaFiltro,
  } = useRendimientoProfesor(profesorId, clasesUnicas, cursosProfesor);

  const {
    planeacionesRecientes,
    loadingPlaneacionesRecientes,
    errorPlaneacionesRecientes,
    rutaDePlaneacion,
  } = usePlaneacionesRecientes(asignacionId, claseSeleccionada, loadingClases);

  const abrirPlaneacionReciente = (planId) => {
    const ruta = rutaDePlaneacion(planId);
    if (ruta) navigate(ruta);
  };

  const irARanking = (ruta) => {
    if (exigirClaseElegida()) navigate(ruta);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Panel del Profesor
        </h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-700">
          <span>
            Hola, <strong className="font-bold text-gray-950">{nombreProfesor}</strong>
          </span>
          <span className="text-sm text-gray-600">
            📚 Prepara tu jornada y acompaña cada avance con calma.
          </span>
        </p>
      </div>

      <ContextoTrabajoProfesor
        asignacionId={asignacionId}
        onCambiarAsignacion={cambiarAsignacion}
        loadingClases={loadingClases}
        clasesUnicas={clasesUnicas}
        claseSeleccionada={claseSeleccionada}
        planeacionesRecientes={planeacionesRecientes}
        loadingPlaneacionesRecientes={loadingPlaneacionesRecientes}
        errorPlaneacionesRecientes={errorPlaneacionesRecientes}
        onAbrirPlaneacion={abrirPlaneacionReciente}
        periodo={periodo}
        onCambiarPeriodo={cambiarPeriodo}
        fecha={fecha}
        onCambiarFecha={cambiarFecha}
      />

      <CumpleanosSemana
        className="mb-6"
        estudiantes={cumpleanos}
        loading={loadingCumpleanos}
        error={errorCumpleanos}
        diasRango={diasRangoCumpleanos}
        emptyText="Esta semana no hay estudiantes de tus cursos asignados cumpliendo años."
      />

      <HorarioSemanal
        loadingClases={loadingClases}
        clasesConHorario={clasesConHorario}
        clasesPorJornada={clasesPorJornada}
        horarioPorJornada={horarioPorJornada}
        hayDosJornadas={hayDosJornadas}
        filtroJornada={filtroJornada}
        onCambiarJornada={setFiltroJornada}
        jornadasVisibles={jornadasVisibles}
      />

      <FiltroRendimiento
        loadingClases={loadingClases}
        cursosProfesor={cursosProfesor}
        cursoFiltro={cursoFiltro}
        onCambiarCurso={cambiarCurso}
        materiasDelCurso={materiasDelCurso}
        materiaFiltro={materiaFiltro}
        onCambiarMateria={setMateriaFiltro}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <TarjetaInasistencias
          inasistencias={inasistencias}
          loading={loadingInasistencias}
        />

        <TarjetaBajoRendimiento
          notasBajas={notasBajas}
          loading={loadingRendimiento}
          cursoFiltroNombre={cursoFiltroNombre}
          materiaFiltroNombre={materiaFiltroNombre}
          onVerRanking={() => irARanking(RUTA_RANKING_BAJO)}
        />

        <TarjetaMejorRendimiento
          notasAltas={notasAltas}
          loading={loadingRendimiento}
          cursoFiltroNombre={cursoFiltroNombre}
          materiaFiltroNombre={materiaFiltroNombre}
          onVerRanking={() => irARanking(RUTA_RANKING_MEJOR)}
        />
      </div>
    </div>
  );
}

export default DashboardProfesor;
