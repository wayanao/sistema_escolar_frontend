import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import api from "../utils/api";

const ESTADOS = ["activo", "en_mora", "suspendido", "cancelado"];

const estadoStyles = {
  activo: "border-emerald-200 bg-emerald-50 text-emerald-800",
  en_mora: "border-amber-200 bg-amber-50 text-amber-800",
  suspendido: "border-rose-200 bg-rose-50 text-rose-800",
  cancelado: "border-slate-300 bg-slate-100 text-slate-700",
};

const estadosCriticos = new Set(["suspendido", "cancelado"]);

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function SuperAdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  const cargarTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/super-admin/tenants");
      setTenants(response.data || []);
    } catch (err) {
      console.error("Error cargando tenants", err);
      setError("No se pudieron cargar los colegios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTenants();
  }, [cargarTenants]);

  const resumen = useMemo(() => {
    return tenants.reduce(
      (acc, tenant) => {
        const estado = tenant.estado || "suspendido";
        acc[estado] = (acc[estado] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, activo: 0, en_mora: 0, suspendido: 0, cancelado: 0 },
    );
  }, [tenants]);

  const cambiarEstado = async (tenant, estado) => {
    if (tenant.estado === estado) return;

    const requiereMotivo = estadosCriticos.has(estado);
    const result = await Swal.fire({
      icon: requiereMotivo ? "warning" : "question",
      title: `Cambiar a ${estado}`,
      text: `${tenant.nombre} pasará de ${tenant.estado} a ${estado}.`,
      input: "textarea",
      inputLabel: requiereMotivo ? "Motivo obligatorio" : "Motivo opcional",
      inputPlaceholder: "Ej. Pago vencido, pago confirmado, solicitud del cliente...",
      inputAttributes: {
        "aria-label": "Motivo del cambio de estado",
      },
      showCancelButton: true,
      confirmButtonText: "Guardar cambio",
      cancelButtonText: "Cancelar",
      confirmButtonColor: requiereMotivo ? "#dc2626" : "#059669",
      inputValidator: (value) => {
        if (requiereMotivo && !String(value || "").trim()) {
          return "Escribe el motivo para suspender o cancelar.";
        }
        return undefined;
      },
    });

    if (!result.isConfirmed) return;

    setSavingId(tenant.id);
    try {
      const response = await api.patch(`/super-admin/tenants/${tenant.id}/estado`, {
        estado,
        motivo: String(result.value || "").trim(),
      });
      setTenants((current) =>
        current.map((item) => (item.id === tenant.id ? response.data : item)),
      );
      Swal.fire({
        icon: "success",
        title: "Estado actualizado",
        text: `${tenant.nombre} quedó en ${estado}.`,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error actualizando tenant", err);
      Swal.fire({
        icon: "error",
        title: "No se pudo actualizar",
        text: "Revisa tu sesión o intenta nuevamente.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const verHistorial = async (tenant) => {
    try {
      const response = await api.get(`/super-admin/tenants/${tenant.id}/estado-auditoria`);
      const history = response.data || [];

      if (history.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Sin historial",
          text: `${tenant.nombre} todavía no tiene cambios de estado registrados.`,
        });
        return;
      }

      const rows = history
        .map((item) => {
          const fecha = item.creado_en
            ? new Date(item.creado_en).toLocaleString("es-CO")
            : "";
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

      Swal.fire({
        title: `Historial de ${tenant.nombre}`,
        width: 820,
        html: `
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
        `,
        confirmButtonText: "Cerrar",
      });
    } catch (err) {
      console.error("Error cargando historial", err);
      Swal.fire({
        icon: "error",
        title: "No se pudo cargar",
        text: "Intenta nuevamente.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Plataforma SaaS
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
            Control de tenants
          </h1>
        </div>
        <button
          type="button"
          onClick={cargarTenants}
          className="w-fit rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          Actualizar
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Total", resumen.total],
          ["Activos", resumen.activo],
          ["En mora", resumen.en_mora],
          ["Suspendidos", resumen.suspendido],
          ["Cancelados", resumen.cancelado],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-bold text-slate-950">Colegios</h2>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-sm text-slate-600">Cargando...</div>
        ) : error ? (
          <div className="px-4 py-8 text-sm font-medium text-rose-700">{error}</div>
        ) : tenants.length === 0 ? (
          <div className="px-4 py-8 text-sm text-slate-600">No hay tenants registrados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Colegio</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Schema</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Cambiar</th>
                  <th className="px-4 py-3">Historial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-950">{tenant.nombre}</td>
                    <td className="px-4 py-3 text-slate-700">{tenant.subdominio}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{tenant.esquema_db}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold uppercase ${
                          estadoStyles[tenant.estado] || estadoStyles.suspendido
                        }`}
                      >
                        {tenant.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={tenant.estado}
                        disabled={savingId === tenant.id}
                        onChange={(event) => cambiarEstado(tenant, event.target.value)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => verHistorial(tenant)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default SuperAdminDashboard;
