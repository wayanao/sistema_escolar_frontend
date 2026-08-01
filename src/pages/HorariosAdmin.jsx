import HorariosProfesores from "../components/administracionAcademica/horarios/HorariosProfesores";
import HorariosPorCurso from "../components/administracionAcademica/horarios/HorariosPorCurso";

function HorariosAdmin() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    📅 Horarios Asignados
                </h1>
                <p className="text-gray-600">
                    Revisa el calendario semanal por profesor y por curso, {usuario?.nombre || "Admin"}.
                </p>
            </div>

            <HorariosProfesores />
            <HorariosPorCurso />
        </div>
    );
}

export default HorariosAdmin;
