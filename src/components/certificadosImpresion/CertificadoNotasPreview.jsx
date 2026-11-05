import DocumentoImprimible from "../impresion/DocumentoImprimible";
import {
  PERIODOS_NUMERICOS,
  formatoNota,
  getDesempeno,
  normalizarTexto,
  obtenerFilasMaterias,
} from "../../utils/certificadosImpresion/certificados";
import { datosInstitucionalesCertificado } from "../../utils/certificadosImpresion/certificadosFormales";
import BarraCertificado from "./BarraCertificado";
import DatoCertificado from "./DatoCertificado";

export default function CertificadoNotasPreview({ certificado, onBack }) {
  const filasMaterias = obtenerFilasMaterias(certificado);
  const notas = filasMaterias
    .flatMap((fila) => Object.values(fila.notasPorPeriodo))
    .filter((nota) => nota !== null);
  const promedio = notas.length
    ? (notas.reduce((total, nota) => total + nota, 0) / notas.length).toFixed(1)
    : "---";
  const estudiante = normalizarTexto(
    certificado.estudiante_nombre_completo,
    `${normalizarTexto(certificado.estudiante_nombre, "")} ${normalizarTexto(certificado.estudiante_apellido, "")}`,
  )
    .trim()
    .replace(/\s+/g, " ");
  const estudianteFormal = estudiante || "el/la estudiante";
  const periodoTexto = certificado.todos_los_periodos
    ? "Todos los periodos"
    : `Periodo ${certificado.periodo}`;
  const fecha = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <BarraCertificado onBack={onBack} />

      <DocumentoImprimible
        tipo="reporte_estudiante"
        className="di-documento--certificado"
        titulo="Certificado de Notas"
        subtitulo={`${periodoTexto} · Año Lectivo ${new Date().getFullYear()}`}
        firmas={(branding) => [
          datosInstitucionalesCertificado(branding).firma,
          { nombre: "", cargo: "Secretaria academica" },
        ]}
      >
        <section className="space-y-5 text-slate-800">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DatoCertificado label="Documento" value={normalizarTexto(certificado.documento_identidad)} />
              <DatoCertificado label="Curso" value={normalizarTexto(certificado.curso)} />
              <DatoCertificado label="Periodo" value={periodoTexto} />
              <DatoCertificado label="Promedio" value={promedio} />
            </div>
          </div>

          <p className="text-justify text-sm leading-7">
            La institucion certifica que <strong className="uppercase">{estudianteFormal}</strong>,
            identificado(a) con documento <strong>{normalizarTexto(certificado.documento_identidad)}</strong>,
            registra las siguientes valoraciones academicas en el curso{" "}
            <strong>{normalizarTexto(certificado.curso)}</strong>, correspondiente a{" "}
            <strong>{periodoTexto.toLowerCase()}</strong> del ano lectivo <strong>{new Date().getFullYear()}</strong>.
          </p>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">Materia</th>
                  <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide">Docente</th>
                  {certificado.todos_los_periodos ? (
                    PERIODOS_NUMERICOS.map((periodoItem) => (
                      <th key={periodoItem} className="w-16 px-3 py-2 text-center font-semibold uppercase tracking-wide">
                        P{periodoItem}
                      </th>
                    ))
                  ) : (
                    <th className="w-24 px-3 py-2 text-center font-semibold uppercase tracking-wide">Nota</th>
                  )}
                  {certificado.todos_los_periodos && (
                    <th className="w-24 px-3 py-2 text-center font-semibold uppercase tracking-wide">Promedio</th>
                  )}
                  <th className="w-28 px-3 py-2 text-center font-semibold uppercase tracking-wide">Desempeno</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filasMaterias.map((materia, index) => {
                  const definitiva = certificado.todos_los_periodos
                    ? materia.promedio
                    : materia.notasPorPeriodo[String(certificado.periodo)];
                  return (
                    <tr key={`${materia.key}-${index}`}>
                      <td className="px-3 py-2 font-semibold uppercase text-slate-800">
                        {materia.nombre}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {materia.docente}
                      </td>
                      {certificado.todos_los_periodos ? (
                        PERIODOS_NUMERICOS.map((periodoItem) => (
                          <td key={periodoItem} className="px-3 py-2 text-center font-black text-slate-900">
                            {formatoNota(materia.notasPorPeriodo[String(periodoItem)] ?? null)}
                          </td>
                        ))
                      ) : (
                        <td className="px-3 py-2 text-center text-base font-black text-slate-900">
                          {formatoNota(definitiva)}
                        </td>
                      )}
                      {certificado.todos_los_periodos && (
                        <td className="px-3 py-2 text-center text-base font-black text-slate-900">
                          {formatoNota(materia.promedio)}
                        </td>
                      )}
                      <td className="px-3 py-2 text-center font-semibold text-slate-700">
                        {getDesempeno(definitiva)}
                      </td>
                    </tr>
                  );
                })}

                {filasMaterias.length === 0 && (
                  <tr>
                    <td colSpan={certificado.todos_los_periodos ? 8 : 4} className="px-3 py-6 text-center font-semibold text-slate-400">
                      No hay notas registradas para la seleccion actual.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-justify text-sm leading-7">
            Este certificado se expide a solicitud del interesado en la fecha {fecha}.
          </p>
        </section>
      </DocumentoImprimible>
    </div>
  );
}
