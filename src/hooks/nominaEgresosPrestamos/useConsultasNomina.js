import { useCallback, useEffect, useState } from "react";
import {
    obtenerEmpleadosNomina,
    obtenerHistorialNomina,
} from "../../services/nominaEgresosPrestamosApi";
import {
    filtrarHistorialNomina,
    hayBusquedaDeHistorial,
} from "../../utils/nominaEgresosPrestamos/nomina";

const useConsultasNomina = () => {
    const [empleados, setEmpleados] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchHistorial, setSearchHistorial] = useState("");

    const cargarDatos = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [datosEmpleados, datosHistorial] = await Promise.all([
                obtenerEmpleadosNomina(),
                obtenerHistorialNomina(),
            ]);
            setEmpleados(datosEmpleados);
            setHistorial(datosHistorial);
        } catch (err) {
            console.error("Error al cargar nómina:", err);
            setError("No se pudo cargar la información de nómina.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // El historial permanece oculto mientras no se escriba un nombre.
    const hayBusqueda = hayBusquedaDeHistorial(searchHistorial);
    const historialMostrado = filtrarHistorialNomina(historial, searchHistorial);

    return {
        empleados,
        historialMostrado,
        hayBusqueda,
        searchHistorial,
        setSearchHistorial,
        loading,
        error,
        cargarDatos,
    };
};

export default useConsultasNomina;
