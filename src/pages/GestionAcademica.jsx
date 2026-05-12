import CrearProfesor from "../components/CrearProfesor";
import CrearCurso from "../components/CrearCurso";
import CrearMateria from "../components/CrearMateria";
import AsignarClase from "../components/AsignarClase";

function GestionAcademica() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    🎓 Gestión Académica
                </h1>
                <p className="text-gray-600">
                    Bienvenido, {usuario?.nombre || "Admin"}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CrearProfesor />
                <CrearCurso />
                <CrearMateria />
                <AsignarClase />
            </div>
        </div>
    );
}

export default GestionAcademica;
