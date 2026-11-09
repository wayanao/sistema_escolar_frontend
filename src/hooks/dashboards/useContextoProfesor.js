import { useState } from "react";
import { primerNombreProfesor } from "../../utils/dashboards/profesor";

// Sesión del profesor en el panel: su identificador y el saludo. Desde el
// 2026-11-09 el panel ya no elige clase, período ni fecha: cada pantalla
// (Planilla, Asistencia, Planeador anual, rankings) los elige arriba.
const useContextoProfesor = () => {
    // Se lee una vez al montar.
    const [profesor] = useState(() => {
        const profesorStorage = localStorage.getItem("profesor");
        return profesorStorage ? JSON.parse(profesorStorage) : null;
    });
    const profesorId = profesor?.id;

    return {
        // Un hook no puede devolver JSX: informa que no hay sesión y la página
        // decide el redirect con el router, sin recargar la aplicación.
        sesionInvalida: !profesorId,
        profesorId,
        nombreProfesor: primerNombreProfesor(profesor),
    };
};

export default useContextoProfesor;
