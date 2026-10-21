import { useCallback, useEffect, useRef, useState } from "react";
import {
    obtenerEmpleadosNomina,
    obtenerHistorialNomina,
} from "../../services/nominaEgresosPrestamosApi";
import {
    busquedaHistorialDeEmpleado,
    filtrarHistorialNomina,
    hayBusquedaDeHistorial,
} from "../../utils/nominaEgresosPrestamos/nomina";

const useConsultasNomina = () => {
    const [empleados, setEmpleados] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState("");
    const [searchHistorial, setSearchHistorial] = useState("");
    // Con los datos ya a la vista, recargar no los esconde: solo avisa que
    // actualiza. `loading` queda para la primera carga, o para reintentarla.
    const hayDatos = useRef(false);

    const cargarDatos = useCallback(async () => {
        if (hayDatos.current) {
            setActualizando(true);
        } else {
            setLoading(true);
        }
        setError("");
        try {
            const [datosEmpleados, datosHistorial] = await Promise.all([
                obtenerEmpleadosNomina(),
                obtenerHistorialNomina(),
            ]);
            setEmpleados(datosEmpleados);
            setHistorial(datosHistorial);
            hayDatos.current = true;
        } catch (err) {
            console.error("Error al cargar nómina:", err);
            setError("No se pudo cargar la información de nómina.");
        } finally {
            setLoading(false);
            setActualizando(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // El historial permanece oculto mientras no se escriba un nombre.
    const hayBusqueda = hayBusquedaDeHistorial(searchHistorial);
    const historialMostrado = filtrarHistorialNomina(historial, searchHistorial);

    // Escribe en el buscador el nombre de la persona, como lo haría el usuario.
    const mostrarHistorialDe = useCallback((empleado) => {
        setSearchHistorial(busquedaHistorialDeEmpleado(empleado));
    }, []);

    return {
        empleados,
        historialMostrado,
        hayBusqueda,
        searchHistorial,
        setSearchHistorial,
        mostrarHistorialDe,
        loading,
        actualizando,
        error,
        cargarDatos,
    };
};

export default useConsultasNomina;
