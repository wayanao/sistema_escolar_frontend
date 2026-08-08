import { useEffect, useState } from "react";
import {
    obtenerCumpleanosAdmin,
    obtenerResumenCarteraParaDashboard,
} from "../../services/dashboardsApi";
import { ROL_ADMIN, esAdmin, primerNombreAdmin } from "../../utils/dashboards/admin";
import {
    DIAS_RANGO_CUMPLEANOS,
    MENSAJE_ERROR_CUMPLEANOS,
    construirParametrosCumpleanos,
    normalizarCumpleanos,
} from "../../utils/dashboards/cumpleanos";

// Cartera y cumpleaños son dos secciones independientes: cada una tiene su
// propio efecto y el fallo de una no afecta a la otra ni a los accesos.
const useDashboardAdmin = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const usuarioRol = usuario?.rol;
    const [resumenCartera, setResumenCartera] = useState(null);
    const [cumpleanos, setCumpleanos] = useState([]);
    const [loadingCumpleanos, setLoadingCumpleanos] = useState(true);
    const [errorCumpleanos, setErrorCumpleanos] = useState("");

    useEffect(() => {
        if (!esAdmin(usuario)) return;
        obtenerResumenCarteraParaDashboard()
            .then((resumen) => setResumenCartera(resumen))
            .catch((err) => console.error("Error cargando resumen cartera:", err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (usuarioRol !== ROL_ADMIN) return;

        let activo = true;
        setLoadingCumpleanos(true);
        setErrorCumpleanos("");

        obtenerCumpleanosAdmin(construirParametrosCumpleanos(DIAS_RANGO_CUMPLEANOS))
            .then((data) => {
                if (!activo) return;
                setCumpleanos(normalizarCumpleanos(data));
            })
            .catch((err) => {
                if (!activo) return;
                console.error("Error cargando cumpleaños:", err);
                setErrorCumpleanos(MENSAJE_ERROR_CUMPLEANOS);
            })
            .finally(() => {
                if (activo) setLoadingCumpleanos(false);
            });

        return () => {
            activo = false;
        };
    }, [usuarioRol]);

    return {
        esAdministrador: esAdmin(usuario),
        nombreAdmin: primerNombreAdmin(usuario?.nombre),
        resumenCartera,
        cumpleanos,
        loadingCumpleanos,
        errorCumpleanos,
        // El rango consultado y el que se pinta no pueden divergir.
        diasRangoCumpleanos: DIAS_RANGO_CUMPLEANOS,
    };
};

export default useDashboardAdmin;
