import DocumentoImprimible from "../impresion/DocumentoImprimible";
import { normalizarTexto } from "../../utils/certificadosImpresion/certificados";
import DatoCertificado from "./DatoCertificado";

export default function CertificadoMatriculaPreview({ certificado, onBack }) {
  const estudiante = normalizarTexto(certificado.estudiante_nombre_completo);
  const documento = normalizarTexto(certificado.documento_identidad);
  const curso = normalizarTexto(certificado.curso);
  const jornada = normalizarTexto(certificado.jornada, "No especificada");
  const estado = normalizarTexto(certificado.estado, "activo");
  const anioLectivo = normalizarTexto(
    certificado.anio_lectivo,
    String(new Date().getFullYear()),
  );
  const fecha = new Date().toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="fixed left-4 top-4 z-50 no-print md:left-6 md:top-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800"
          title="Atras"
        >
          ← Atrás
        </button>
      </div>

      <DocumentoImprimible
        tipo="reporte_estudiante"
        className="di-documento--certificado"
        titulo="Certificado de Matrícula"
        subtitulo={`Año Lectivo ${anioLectivo}`}
        firmas={[
          { nombre: "", cargo: "Director(a)" },
          { nombre: "", cargo: "Secretaria academica" },
        ]}
      >
        <section className="space-y-6 text-slate-800">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DatoCertificado label="Documento" value={documento} />
              <DatoCertificado label="Curso" value={curso} />
              <DatoCertificado label="Jornada" value={jornada} />
              <DatoCertificado label="Estado" value={estado} />
            </div>
          </div>

          <div className="space-y-4 text-justify text-sm leading-8">
            <p>
              La institución educativa certifica que <strong className="uppercase">{estudiante}</strong>,
              identificado(a) con documento de identidad <strong>{documento}</strong>, se encuentra
              matriculado(a) en esta institución para el año lectivo <strong>{anioLectivo}</strong>,
              cursando <strong>{curso}</strong>
              {jornada !== "No especificada" ? (
                <>
                  {" "}en la jornada <strong>{jornada}</strong>
                </>
              ) : null}
              .
            </p>

            <p>
              El presente certificado se expide a solicitud del interesado para los fines que estime
              convenientes, incluyendo trámites administrativos, pensiones, subsidios u otros soportes
              requeridos por entidades externas.
            </p>

            <p>
              Se expide en la fecha {fecha}.
            </p>
          </div>
        </section>
      </DocumentoImprimible>
    </div>
  );
}
