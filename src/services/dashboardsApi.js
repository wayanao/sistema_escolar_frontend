import api from "../utils/api";

// Transporte HTTP de los dashboards por rol y de los dos rankings del profesor.
// Las funciones devuelven datos o propagan el error de Axios sin decidir
// mensajes visuales.

// ── Panel de administración ─────────────────────────────────────────────────

// Dependencia de solo lectura del módulo de cartera. El sufijo deja explícito
// que es un consumo para el dashboard y no la puerta de entrada a ese dominio.
export const obtenerResumenCarteraParaDashboard = async () => {
    const response = await api.get("/cartera/mora/resumen");
    return response.data;
};

export const obtenerCumpleanosAdmin = async (params) => {
    const response = await api.get("/dashboard/cumpleanos/admin", { params });
    return response.data;
};

// ── Panel del profesor ──────────────────────────────────────────────────────

export const obtenerClasesProfesor = async (profesorId) => {
    const response = await api.get(`/mis-clases/${profesorId}`);
    return response.data;
};

export const obtenerInasistenciasProfesor = async (profesorId) => {
    const response = await api.get(`/dashboard/inasistencias/${profesorId}`);
    return response.data;
};

export const obtenerCumpleanosProfesor = async (profesorId, params) => {
    const response = await api.get(`/dashboard/cumpleanos/profesor/${profesorId}`, { params });
    return response.data;
};

export const obtenerNotasBajasProfesor = async (profesorId, params) => {
    const response = await api.get(`/dashboard/notas-bajas/${profesorId}`, { params });
    return response.data;
};

export const obtenerNotasAltasProfesor = async (profesorId, params) => {
    const response = await api.get(`/dashboard/notas-altas/${profesorId}`, { params });
    return response.data;
};

// Dependencia de solo lectura del módulo de planeaciones.
export const obtenerPlaneacionesRecientes = async (asignacionId, params) => {
    const response = await api.get(`/plan-de-clases/${asignacionId}`, { params });
    return response.data;
};

// ── Rankings del profesor ───────────────────────────────────────────────────

export const obtenerRankingBajoRendimiento = async (asignacionId, periodo) => {
    const response = await api.get(`/dashboard/ranking/${asignacionId}/${periodo}`);
    return response.data;
};

export const obtenerRankingMejorRendimiento = async (asignacionId, periodo) => {
    const response = await api.get(`/dashboard/ranking-mejor/${asignacionId}/${periodo}`);
    return response.data;
};

// ── Panel del super administrador ───────────────────────────────────────────

export const listarTenants = async () => {
    const response = await api.get("/super-admin/tenants");
    return response.data;
};

export const crearTenant = async (payload) => {
    const response = await api.post("/super-admin/tenants", payload);
    return response.data;
};

export const actualizarEstadoTenant = async (tenantId, payload) => {
    const response = await api.patch(`/super-admin/tenants/${tenantId}/estado`, payload);
    return response.data;
};

export const obtenerAuditoriaEstadoTenant = async (tenantId) => {
    const response = await api.get(`/super-admin/tenants/${tenantId}/estado-auditoria`);
    return response.data;
};
