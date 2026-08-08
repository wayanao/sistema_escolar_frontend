import {
  ESTADOS_TENANT,
  claseEstadoTenant,
  estadoManualDe,
} from "../../../utils/dashboards/superAdmin";

function TablaTenants({ tenants, loading, error, savingId, onCambiarEstado, onVerHistorial }) {
  return (
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
                <th className="px-4 py-3">Próximo pago</th>
                <th className="px-4 py-3">Gracia</th>
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
                  <td className="px-4 py-3 text-slate-700">{tenant.fecha_proximo_pago || "Sin fecha"}</td>
                  <td className="px-4 py-3 text-slate-700">{tenant.dias_gracia ?? 0} dias</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold uppercase ${claseEstadoTenant(
                        tenant.estado,
                      )}`}
                    >
                      {tenant.estado}
                    </span>
                    {tenant.estado_manual && tenant.estado_manual !== tenant.estado ? (
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Manual: {tenant.estado_manual}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={estadoManualDe(tenant)}
                      disabled={savingId === tenant.id}
                      onChange={(event) => onCambiarEstado(tenant, event.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {ESTADOS_TENANT.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onVerHistorial(tenant)}
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
  );
}

export default TablaTenants;
