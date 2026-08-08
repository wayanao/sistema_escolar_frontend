function ResumenTenants({ resumen }) {
  return (
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
  );
}

export default ResumenTenants;
