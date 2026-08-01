import useHorariosProfesores from "../../../hooks/administracionAcademica/useHorariosProfesores";
import CalendarioProfesores from "./CalendarioProfesores";

function HorariosProfesores() {
    const {
        horarios,
        cargando,
        profesorSeleccionado,
        setProfesorSeleccionado,
        profesoresUnicos,
        horariosDelProfesor,
    } = useHorariosProfesores();

    return (
        <CalendarioProfesores
            horarios={horarios}
            cargando={cargando}
            profesorSeleccionado={profesorSeleccionado}
            profesoresUnicos={profesoresUnicos}
            horariosDelProfesor={horariosDelProfesor}
            onSeleccionarProfesor={setProfesorSeleccionado}
        />
    );
}

export default HorariosProfesores;
