// Contratos y transformaciones puras del panel de super administración.
// Incluye la regla de clase por estado que la capa 5 extrajo de la página. La
// lectura de los campos del diálogo sí permanece fuera, porque toca el DOM.

import { fechaIsoColombia } from "../fechaColombia";

export const ESTADOS_TENANT = ["activo", "en_mora", "suspendido", "cancelado"];

export const ESTADO_TENANT_POR_DEFECTO = "suspendido";

export const MENSAJE_ERROR_CARGA_TENANTS = "No se pudieron cargar los colegios.";

export const MENSAJE_MOTIVO_OBLIGATORIO = "Escribe el motivo para suspender o cancelar.";

export const MENSAJE_ERROR_CREAR_TENANT = "Revisa los datos e intenta nuevamente.";

const ESTADOS_CRITICOS = new Set(["suspendido", "cancelado"]);

const CORREO_VALIDO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const CODIGO_VALIDO = /^[a-z0-9_]{3,50}$/;

const ESTADO_TENANT_ESTILOS = {
    activo: "border-emerald-200 bg-emerald-50 text-emerald-800",
    en_mora: "border-amber-200 bg-amber-50 text-amber-800",
    suspendido: "border-rose-200 bg-rose-50 text-rose-800",
    cancelado: "border-slate-300 bg-slate-100 text-slate-700",
};

// Un estado desconocido se pinta como suspendido, igual que en el resumen.
export const claseEstadoTenant = (estado) =>
    ESTADO_TENANT_ESTILOS[estado] || ESTADO_TENANT_ESTILOS[ESTADO_TENANT_POR_DEFECTO];

export const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

// La fecha de Colombia, no la UTC (ver utils/fechaColombia.js).
export const fechaIsoDeHoy = (ahora) => fechaIsoColombia(ahora);

export const erroresDePassword = (value) => {
    const errors = [];
    if ((value || "").length < 10) errors.push("minimo 10 caracteres");
    if (!/[A-Z]/.test(value || "")) errors.push("una mayuscula");
    if (!/[a-z]/.test(value || "")) errors.push("una minuscula");
    if (!/[0-9]/.test(value || "")) errors.push("un numero");
    return errors;
};

export const normalizarListaTenants = (data) => data || [];

export const resumirTenants = (tenants) =>
    tenants.reduce(
        (acc, tenant) => {
            const estado = tenant.estado || ESTADO_TENANT_POR_DEFECTO;
            acc[estado] = (acc[estado] || 0) + 1;
            acc.total += 1;
            return acc;
        },
        { total: 0, activo: 0, en_mora: 0, suspendido: 0, cancelado: 0 },
    );

// El selector compara contra el estado manual, no contra el calculado por el
// backend: un tenant puede estar `en_mora` con estado manual `activo`.
export const estadoManualDe = (tenant) => tenant.estado_manual || tenant.estado;

export const requiereMotivoDeEstado = (estado) => ESTADOS_CRITICOS.has(estado);

export const textoConfirmacionEstado = (tenant, estado) =>
    `${tenant.nombre} pasara de ${estadoManualDe(tenant)} a ${estado}.`;

export const validarMotivoEstado = (estado, motivo) => {
    if (requiereMotivoDeEstado(estado) && !String(motivo || "").trim()) {
        return MENSAJE_MOTIVO_OBLIGATORIO;
    }
    return undefined;
};

export const construirPayloadEstado = (estado, motivo) => ({
    estado,
    motivo: String(motivo || "").trim(),
});

// Recibe los valores crudos del diálogo y devuelve exactamente el cuerpo que
// acepta `POST /super-admin/tenants`.
export const normalizarPayloadTenant = (valores = {}) => ({
    nombre: valores.nombre?.trim(),
    codigo: valores.codigo?.trim().toLowerCase(),
    admin_nombre: valores.admin_nombre?.trim(),
    admin_email: valores.admin_email?.trim().toLowerCase(),
    admin_password: valores.admin_password,
    fecha_inicio: valores.fecha_inicio,
    fecha_proximo_pago: valores.fecha_proximo_pago,
    dias_gracia: Number(valores.dias_gracia || 0),
    notas: valores.notas?.trim(),
});

// Devuelve el primer mensaje de validación o una cadena vacía. El orden es el
// que ya tenía el diálogo y no debe cambiar.
export const validarTenantNuevo = (payload) => {
    if (
        !payload.nombre ||
        !payload.codigo ||
        !payload.admin_nombre ||
        !payload.admin_email ||
        !payload.admin_password
    ) {
        return "Completa colegio, codigo y admin inicial.";
    }
    if (!CORREO_VALIDO.test(payload.admin_email)) {
        return "Escribe un correo valido para el admin.";
    }
    const passErrors = erroresDePassword(payload.admin_password);
    if (passErrors.length) {
        return `La password temporal debe incluir ${passErrors.join(", ")}.`;
    }
    if (!CODIGO_VALIDO.test(payload.codigo)) {
        return "El codigo debe usar minusculas, numeros o guion bajo, minimo 3 caracteres.";
    }
    if (!payload.fecha_inicio || !payload.fecha_proximo_pago) {
        return "Completa las fechas de suscripcion.";
    }
    if (payload.fecha_proximo_pago < payload.fecha_inicio) {
        return "El proximo pago no puede ser anterior al inicio.";
    }
    if (payload.dias_gracia < 0) {
        return "Los dias de gracia no pueden ser negativos.";
    }
    return "";
};

export const mensajeErrorCrearTenant = (error) => {
    const detail = error?.response?.data?.detail;
    return typeof detail === "string" ? detail : MENSAJE_ERROR_CREAR_TENANT;
};

export const formatearFechaAuditoria = (valor) =>
    valor ? new Date(valor).toLocaleString("es-CO") : "";

// Marcado del formulario de alta que pinta SweetAlert. Los identificadores son
// el contrato que después lee el comando desde el DOM.
export const htmlFormularioTenant = (hoy) => `
        <div class="grid gap-3 text-left sm:grid-cols-2">
          <label class="text-xs font-bold uppercase text-slate-500">
            Nombre colegio
            <input id="tenant-nombre" class="swal2-input" placeholder="Colegio Demo" />
          </label>
          <label class="text-xs font-bold uppercase text-slate-500">
            Codigo acceso
            <input id="tenant-codigo" class="swal2-input" placeholder="colegio_demo" />
          </label>
          <label class="text-xs font-bold uppercase text-slate-500">
            Admin nombre
            <input id="tenant-admin-nombre" class="swal2-input" placeholder="Administrador" />
          </label>
          <label class="text-xs font-bold uppercase text-slate-500">
            Admin correo
            <input id="tenant-admin-email" type="email" class="swal2-input" placeholder="admin@colegio.com" />
          </label>
          <label class="text-xs font-bold uppercase text-slate-500">
            Password temporal
            <input id="tenant-admin-password" type="password" class="swal2-input" placeholder="Password temporal" />
          </label>
          <label class="text-xs font-bold uppercase text-slate-500">
            Dias de gracia
            <input id="tenant-dias-gracia" type="number" min="0" class="swal2-input" value="5" />
          </label>
          <label class="text-xs font-bold uppercase text-slate-500">
            Fecha inicio
            <input id="tenant-fecha-inicio" type="date" class="swal2-input" value="${hoy}" />
          </label>
          <label class="text-xs font-bold uppercase text-slate-500">
            Proximo pago
            <input id="tenant-fecha-pago" type="date" class="swal2-input" value="${hoy}" />
          </label>
          <label class="text-xs font-bold uppercase text-slate-500 sm:col-span-2">
            Notas
            <textarea id="tenant-notas" class="swal2-textarea" placeholder="Plan, observaciones de suscripcion..."></textarea>
          </label>
        </div>
      `;

export const htmlHistorialTenant = (historial) => {
    const rows = historial
        .map((item) => {
            const fecha = formatearFechaAuditoria(item.creado_en);
            return `
            <tr>
              <td>${escapeHtml(fecha)}</td>
              <td>${escapeHtml(item.estado_anterior)} → ${escapeHtml(item.estado_nuevo)}</td>
              <td>${escapeHtml(item.motivo || "Sin motivo")}</td>
              <td>${escapeHtml(item.super_admin_nombre || item.super_admin_email || "")}</td>
            </tr>
          `;
        })
        .join("");

    return `
          <div class="max-h-[420px] overflow-auto text-left">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="border-b border-slate-200 text-slate-500">
                  <th class="py-2 pr-3 text-left">Fecha</th>
                  <th class="py-2 pr-3 text-left">Cambio</th>
                  <th class="py-2 pr-3 text-left">Motivo</th>
                  <th class="py-2 text-left">Responsable</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">${rows}</tbody>
            </table>
          </div>
        `;
};
