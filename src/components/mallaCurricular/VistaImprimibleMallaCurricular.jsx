import DocumentoImprimible from "../impresion/DocumentoImprimible";

export default function VistaImprimibleMallaCurricular({
  asignacion,
  onRegresar,
  periodo,
  planeadores,
}) {
  return (
    <div className="fixed inset-0 bg-slate-100 z-50 overflow-auto">
      <div className="fixed left-4 top-4 no-print z-[60] md:left-6 md:top-6">
        <button
          onClick={onRegresar}
          className="bg-slate-800 text-white px-4 py-2.5 rounded-full text-sm font-bold shadow-xl hover:bg-slate-900 transition"
          title="Atras"
        >
          ← Atrás
        </button>
      </div>
      <DocumentoImprimible
        tipo="planeador"
        className="di-documento--planeador"
        titulo="Planeador Anual de Clases"
        subtitulo={`${asignacion ? `${asignacion.curso} · ${asignacion.materia} · ` : ""}Período ${periodo}`}
      >
        <table className="w-full border-collapse text-xs">
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider">
              <th className="border border-slate-300 px-2 py-2 text-left">Unidad temática</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Estándar/competencia</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Contenido</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Actividades y recursos</th>
              <th className="border border-slate-300 px-2 py-2 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {planeadores.map((planeador, index) => (
              <tr key={index} className="align-top">
                <td className="border border-slate-300 px-2 py-2 whitespace-pre-wrap">{planeador.unidad_tematica || ""}</td>
                <td className="border border-slate-300 px-2 py-2 whitespace-pre-wrap">{planeador.estandar_competencia || ""}</td>
                <td className="border border-slate-300 px-2 py-2 whitespace-pre-wrap">{planeador.contenido || ""}</td>
                <td className="border border-slate-300 px-2 py-2 whitespace-pre-wrap">{planeador.actividades_recursos || ""}</td>
                <td className="border border-slate-300 px-2 py-2">{planeador.fecha || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DocumentoImprimible>
    </div>
  );
}
