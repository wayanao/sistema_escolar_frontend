import { Navigate, useNavigate } from "react-router-dom";
import EncabezadoPanelProfesor from "../components/dashboards/profesor/EncabezadoPanelProfesor";
import FiltroRendimiento from "../components/dashboards/profesor/FiltroRendimiento";
import HorarioDelDia from "../components/dashboards/profesor/HorarioDelDia";
import TarjetaBajoRendimiento from "../components/dashboards/profesor/TarjetaBajoRendimiento";
import TarjetaInasistencias from "../components/dashboards/profesor/TarjetaInasistencias";
import TarjetaMejorRendimiento from "../components/dashboards/profesor/TarjetaMejorRendimiento";
import useAhora from "../hooks/dashboards/useAhora";
import useClasesProfesor from "../hooks/dashboards/useClasesProfesor";
import useContextoProfesor from "../hooks/dashboards/useContextoProfesor";
import useCumpleanosProfesor from "../hooks/dashboards/useCumpleanosProfesor";
import useEntrarAClaseProfesor, {
  RUTA_ASISTENCIA,
  RUTA_PLANILLA,
} from "../hooks/dashboards/useEntrarAClaseProfesor";
import useInasistenciasProfesor from "../hooks/dashboards/useInasistenciasProfesor";
import useRendimientoProfesor from "../hooks/dashboards/useRendimientoProfesor";
import { RUTA_RANKING_BAJO, RUTA_RANKING_MEJOR } from "../utils/dashboards/profesor";
import {
  diaSemanaColombia,
  fechaLargaColombia,
  minutosDelDiaColombia,
} from "../utils/fechaColombia";

// Panel del profesor (rediseño del 2026-11-10), de arriba abajo: el día, el
// período y los cumpleaños; el horario en tarjetas desde las que se entra a
// la clase; y cómo van sus estudiantes. Sin peticiones nuevas: el horario
// sale de `/mis-clases`, que ya se cargaba.
function DashboardProfesor() {
  const navigate = useNavigate();
  const ahora = useAhora();
  const { sesionInvalida, profesorId, nombreProfesor, periodo } = useContextoProfesor();
  const entrarAClase = useEntrarAClaseProfesor();

  const {
    loadingClases,
    errorClases,
    clasesUnicas,
    cursosProfesor,
    clasesPorDia,
    hayDosJornadas,
  } = useClasesProfesor(profesorId);

  const { inasistencias, loadingInasistencias, errorInasistencias } =
    useInasistenciasProfesor(profesorId);

  const { cumpleanos, loadingCumpleanos, errorCumpleanos } =
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
    errorRendimiento,
    cambiarCurso,
    setMateriaFiltro,
  } = useRendimientoProfesor(profesorId, clasesUnicas, cursosProfesor);

  if (sesionInvalida) {
    return <Navigate to="/login" />;
  }

  return (
    // Sin fondo propio: el de la app (`fondo-aula`, con dibujos escolares) se
    // ve detrás del encabezado, que va sin caja.
    <div className="min-h-screen p-4 sm:p-6">
      <EncabezadoPanelProfesor
        nombreProfesor={nombreProfesor}
        fechaDeHoy={fechaLargaColombia(ahora)}
        periodo={periodo}
        cumpleanos={cumpleanos}
        loadingCumpleanos={loadingCumpleanos}
        errorCumpleanos={errorCumpleanos}
        ahora={ahora}
      />

      <HorarioDelDia
        loadingClases={loadingClases}
        errorClases={errorClases}
        clasesPorDia={clasesPorDia}
        hayDosJornadas={hayDosJornadas}
        hoy={diaSemanaColombia(ahora)}
        minutosAhora={minutosDelDiaColombia(ahora)}
        onTomarAsistencia={(clase) => entrarAClase(clase, RUTA_ASISTENCIA)}
        onAbrirPlanilla={(clase) => entrarAClase(clase, RUTA_PLANILLA)}
      />

      <section aria-labelledby="resultados-titulo">
        <div className="mb-3 px-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-700">Tus estudiantes</p>
          <h2 id="resultados-titulo" className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
            Cómo van tus estudiantes
          </h2>
        </div>

        <FiltroRendimiento
          loadingClases={loadingClases}
          errorClases={errorClases}
          cursosProfesor={cursosProfesor}
          cursoFiltro={cursoFiltro}
          onCambiarCurso={cambiarCurso}
          materiasDelCurso={materiasDelCurso}
          materiaFiltro={materiaFiltro}
          onCambiarMateria={setMateriaFiltro}
        />

        <div className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 xl:grid-cols-3">
          <TarjetaBajoRendimiento
            notasBajas={notasBajas}
            loading={loadingRendimiento}
            error={errorRendimiento}
            cursoFiltroNombre={cursoFiltroNombre}
            materiaFiltroNombre={materiaFiltroNombre}
            onVerRanking={() => navigate(RUTA_RANKING_BAJO)}
          />

          <TarjetaMejorRendimiento
            notasAltas={notasAltas}
            loading={loadingRendimiento}
            error={errorRendimiento}
            cursoFiltroNombre={cursoFiltroNombre}
            materiaFiltroNombre={materiaFiltroNombre}
            onVerRanking={() => navigate(RUTA_RANKING_MEJOR)}
          />

          <TarjetaInasistencias
            inasistencias={inasistencias}
            loading={loadingInasistencias}
            error={errorInasistencias}
          />
        </div>
      </section>
    </div>
  );
}

export default DashboardProfesor;
