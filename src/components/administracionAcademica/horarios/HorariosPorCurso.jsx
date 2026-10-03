import useAnioLectivo from "../../../hooks/anioLectivo/useAnioLectivo";
import useHorariosPorCurso from "../../../hooks/administracionAcademica/useHorariosPorCurso";
import CalendarioPorCurso from "./CalendarioPorCurso";

function HorariosPorCurso() {
    const { parametros } = useAnioLectivo();
    const {
        horarios,
        cargando,
        cursoSeleccionado,
        setCursoSeleccionado,
        busqueda,
        setBusqueda,
        cursosFiltrados,
        horariosDelCurso,
    } = useHorariosPorCurso({ parametrosAnio: parametros });

    return (
        <CalendarioPorCurso
            horarios={horarios}
            cargando={cargando}
            cursoSeleccionado={cursoSeleccionado}
            busqueda={busqueda}
            cursosFiltrados={cursosFiltrados}
            horariosDelCurso={horariosDelCurso}
            onCambiarBusqueda={setBusqueda}
            onSeleccionarCurso={setCursoSeleccionado}
        />
    );
}

export default HorariosPorCurso;
