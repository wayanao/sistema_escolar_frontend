import ResumenTenants from "../components/dashboards/superAdmin/ResumenTenants";
import TablaTenants from "../components/dashboards/superAdmin/TablaTenants";
import useAltaTenant from "../hooks/dashboards/useAltaTenant";
import useEstadoTenant from "../hooks/dashboards/useEstadoTenant";
import useTenants from "../hooks/dashboards/useTenants";

function SuperAdminDashboard() {
  const {
    tenants,
    loading,
    error,
    resumen,
    cargarTenants,
    agregarTenant,
    reemplazarTenant,
  } = useTenants();
  const { crearColegio } = useAltaTenant(agregarTenant);
  const { savingId, cambiarEstado, verHistorial } = useEstadoTenant(reemplazarTenant);

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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={crearColegio}
            className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Crear colegio
          </button>
          <button
            type="button"
            onClick={cargarTenants}
            className="w-fit rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Actualizar
          </button>
        </div>
      </section>

      <ResumenTenants resumen={resumen} />

      <TablaTenants
        tenants={tenants}
        loading={loading}
        error={error}
        savingId={savingId}
        onCambiarEstado={cambiarEstado}
        onVerHistorial={verHistorial}
      />
    </div>
  );
}

export default SuperAdminDashboard;
