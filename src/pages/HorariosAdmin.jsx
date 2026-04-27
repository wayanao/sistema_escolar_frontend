import HorariosProfesores from "../components/HorariosProfesores";

function HorariosAdmin() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    📅 Horarios Asignados
                </h1>
                <p className="text-gray-600">
                    Revisa el calendario semanal de los profesores, {usuario?.nombre || "Admin"}.
                </p>
            </div>
            
            <HorariosProfesores />
        </div>
    );
}

export default HorariosAdmin;