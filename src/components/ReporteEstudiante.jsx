import DocumentoImprimible from "./impresion/DocumentoImprimible";

function ReporteEstudiante({ estudiante, observacion, profesorNombre }) {
  const firmas = [
    { nombre: profesorNombre || "Profesor", cargo: "Firma del Profesor" },
    { nombre: "Rectora", cargo: "Firma de Rectoría" },
  ];

  const subtitulo = estudiante
    ? `${estudiante.nombre || ""} ${estudiante.apellido || ""}`.trim()
    : undefined;

  return (
    <DocumentoImprimible
      tipo="reporte_estudiante"
      titulo="Reporte del Estudiante"
      subtitulo={subtitulo}
      firmas={firmas}
    >
      <section className="space-y-4">
        <div>
          <h3 className="text-red-600 font-bold uppercase tracking-wide">
            Dimensión Conductual / Disciplinario
          </h3>
          <p className="whitespace-pre-wrap mt-1">{observacion?.conductual || "---"}</p>
        </div>

        <div>
          <h3 className="text-red-600 font-bold uppercase tracking-wide">
            Dimensión Cognitiva
          </h3>
          <p className="whitespace-pre-wrap mt-1">{observacion?.cognitivo || "---"}</p>
        </div>

        <div>
          <h3 className="text-red-600 font-bold uppercase tracking-wide">
            Dimensión del Lenguaje
          </h3>
          <p className="whitespace-pre-wrap mt-1">{observacion?.lenguaje || "---"}</p>
        </div>
      </section>
    </DocumentoImprimible>
  );
}

export default ReporteEstudiante;
