const TONOS_DATO = {
  materia: "text-violet-700",
  curso: "text-sky-700",
  periodo: "text-emerald-700",
  fecha: "text-amber-700",
};

function formatearFechaCurso(valor) {
  if (!valor) return "No especificada";
  const fecha = new Date(String(valor).includes("T") ? valor : `${valor}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return String(valor);

  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(fecha);
}

function DatoCurso({ label, value, tono, translateNo = false }) {
  return (
    <div className="min-w-0 py-1">
      <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${TONOS_DATO[tono]}`}>{label}</p>
      <p
        className="mt-1 break-words text-sm font-bold leading-5 text-slate-900"
        title={value}
        translate={translateNo ? "no" : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function EncabezadoContextoCurso({
  titulo,
  etiqueta,
  descripcion,
  materia,
  curso,
  periodo,
  fecha,
  children,
}) {
  const gridClass = children
    ? "sm:grid-cols-2 xl:grid-cols-5"
    : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-purple-100 bg-white shadow-sm">
      <div className="px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-stretch gap-3">
          <span className="w-1 shrink-0 rounded-full bg-purple-600" aria-hidden="true"></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">{titulo}</h1>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">{etiqueta}</span>
            </div>
            <p className="mt-0.5 text-sm text-gray-600">{descripcion}</p>
            <div className="mb-3 mt-5">
              <h2 className="text-sm font-bold text-slate-950">Información de trabajo</h2>
              <p className="mt-0.5 text-xs text-slate-500">Contexto seleccionado desde el dashboard.</p>
            </div>
            <div className={`grid grid-cols-1 gap-x-6 gap-y-3 ${gridClass}`}>
              <DatoCurso label="Materia" value={materia || "No seleccionada"} tono="materia" translateNo />
              <DatoCurso label="Salón" value={curso || "No seleccionado"} tono="curso" translateNo />
              <DatoCurso label="Período" value={periodo ? `Período ${periodo}` : "No especificado"} tono="periodo" />
              <DatoCurso label="Fecha de trabajo" value={formatearFechaCurso(fecha)} tono="fecha" />
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default EncabezadoContextoCurso;
