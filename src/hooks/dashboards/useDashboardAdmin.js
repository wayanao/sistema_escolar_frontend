import { useEffect, useState } from "react";
import {
    obtenerCumpleanosAdmin,
    obtenerPuntualidadParaDashboard,
    obtenerResumenCarteraParaDashboard,
} from "../../services/dashboardsApi";
import {
    MENSAJE_ERROR_CARTERA,
    esAdmin,
    primerNombreAdmin,
} from "../../utils/dashboards/admin";
import {
    DIAS_RANGO_CUMPLEANOS,
    MENSAJE_ERROR_CUMPLEANOS,
    construirParametrosCumpleanos,
    normalizarCumpleanos,
} from "../../utils/dashboards/cumpleanos";
import {
    MENSAJE_ERROR_PUNTUALIDAD,
    normalizarPuntualidad,
} from "../../utils/dashboards/puntualidad";

// Cartera, puntualidad y cumpleaños son secciones independientes: cada una
// tiene su propio efecto y el fallo de una no afecta a las otras ni a los
// accesos.
const useDashboardAdmin = () => {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    // `usuario` se relee del almacenamiento en cada render, así que es un objeto
    // nuevo cada vez y no sirve como dependencia. Los dos efectos dependen de
    // este booleano, cuya identidad sí es estable.
    const esAdministrador = esAdmin(usuario);
    const [resumenCartera, setResumenCartera] = useState(null);
    // Mientras llega el resumen no se sabe si hay deuda: sin esta bandera, la
    // espera se pintaba como «Cartera al día».
    const [cargandoCartera, setCargandoCartera] = useState(true);
    const [errorCartera, setErrorCartera] = useState("");
    const [puntualidad, setPuntualidad] = useState(null);
    const [cargandoPuntualidad, setCargandoPuntualidad] = useState(true);
    const [errorPuntualidad, setErrorPuntualidad] = useState("");
    const [cumpleanos, setCumpleanos] = useState([]);
    const [loadingCumpleanos, setLoadingCumpleanos] = useState(true);
    const [errorCumpleanos, setErrorCumpleanos] = useState("");

    useEffect(() => {
        if (!esAdministrador) return;

        let activo = true;
        obtenerResumenCarteraParaDashboard()
            .then((resumen) => {
                if (activo) setResumenCartera(resumen);
            })
            .catch((err) => {
                console.error("Error cargando resumen cartera:", err);
                if (activo) setErrorCartera(MENSAJE_ERROR_CARTERA);
            })
            .finally(() => {
                if (activo) setCargandoCartera(false);
            });

        return () => {
            activo = false;
        };
    }, [esAdministrador]);

    useEffect(() => {
        if (!esAdministrador) return;

        let activo = true;
        obtenerPuntualidadParaDashboard()
            .then((data) => {
                if (activo) setPuntualidad(normalizarPuntualidad(data));
            })
            .catch((err) => {
                console.error("Error cargando la puntualidad de pagos:", err);
                if (activo) setErrorPuntualidad(MENSAJE_ERROR_PUNTUALIDAD);
            })
            .finally(() => {
                if (activo) setCargandoPuntualidad(false);
            });

        return () => {
            activo = false;
        };
    }, [esAdministrador]);

    useEffect(() => {
        if (!esAdministrador) return;

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
    }, [esAdministrador]);

    return {
        esAdministrador,
        nombreAdmin: primerNombreAdmin(usuario?.nombre),
        resumenCartera,
        cargandoCartera,
        errorCartera,
        puntualidad,
        cargandoPuntualidad,
        errorPuntualidad,
        cumpleanos,
        loadingCumpleanos,
        errorCumpleanos,
        // El rango consultado y el que se pinta no pueden divergir.
        diasRangoCumpleanos: DIAS_RANGO_CUMPLEANOS,
    };
};

export default useDashboardAdmin;
