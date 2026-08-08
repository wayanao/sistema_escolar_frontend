import { useCallback, useEffect, useMemo, useState } from "react";
import { listarTenants } from "../../services/dashboardsApi";
import {
    MENSAJE_ERROR_CARGA_TENANTS,
    normalizarListaTenants,
    resumirTenants,
} from "../../utils/dashboards/superAdmin";

const useTenants = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const cargarTenants = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setTenants(normalizarListaTenants(await listarTenants()));
        } catch (err) {
            console.error("Error cargando tenants", err);
            setError(MENSAJE_ERROR_CARGA_TENANTS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarTenants();
    }, [cargarTenants]);

    const resumen = useMemo(() => resumirTenants(tenants), [tenants]);

    // El colegio creado se agrega al final de la lista en memoria: no se
    // reordena ni se vuelve a consultar el backend.
    const agregarTenant = useCallback((tenant) => {
        setTenants((current) => [...current, tenant]);
    }, []);

    // Se compara contra el identificador de la fila que se estaba editando, no
    // contra el de la respuesta, igual que antes de la migración.
    const reemplazarTenant = useCallback((tenantId, actualizado) => {
        setTenants((current) =>
            current.map((item) => (item.id === tenantId ? actualizado : item)),
        );
    }, []);

    return {
        tenants,
        loading,
        error,
        resumen,
        cargarTenants,
        agregarTenant,
        reemplazarTenant,
    };
};

export default useTenants;
