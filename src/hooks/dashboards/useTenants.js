import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    // `Actualizar` puede pulsarse varias veces seguidas. Se numera cada consulta
    // para que una respuesta tardía no pise a la vigente.
    const peticionRef = useRef(0);

    const cargarTenants = useCallback(async () => {
        const peticion = (peticionRef.current += 1);
        const vigente = () => peticion === peticionRef.current;

        setLoading(true);
        setError("");
        try {
            const datos = normalizarListaTenants(await listarTenants());
            if (!vigente()) return;
            setTenants(datos);
        } catch (err) {
            console.error("Error cargando tenants", err);
            if (!vigente()) return;
            setError(MENSAJE_ERROR_CARGA_TENANTS);
        } finally {
            if (vigente()) setLoading(false);
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
