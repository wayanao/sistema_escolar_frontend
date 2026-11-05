import { useId, useState } from "react";

import DocumentoImprimible from "../impresion/DocumentoImprimible";
import {
  TRATAMIENTOS,
  TRATAMIENTO_INICIAL,
  datosInstitucionalesCertificado,
  fraseExpedicion,
} from "../../utils/certificadosImpresion/certificadosFormales";
import BarraCertificado from "./BarraCertificado";

const OPCIONES_TRATAMIENTO = TRATAMIENTOS.map(({ value, label }) => ({ value, label }));

// Una opción de impresión arriba de la hoja; no sale en el papel.
export function OpcionCertificado({ etiqueta, valor, opciones, onCambiar }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-slate-600">
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(event) => onCambiar(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
      >
        {opciones.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
        ))}
      </select>
    </div>
  );
}

// Hoja con el formato de los modelos del colegio (matrícula, conducta,
// aprobado). `construirParrafo(tratamiento)` da el párrafo de cada uno; quién
// firma, la frase de arriba y la ciudad salen de la identidad institucional.
// "En el texto decir" vive aquí y no en un hook: es solo para esta impresión
// y vuelve a "el(la) estudiante" con cada estudiante.
export default function CertificadoFormal({ construirParrafo, opciones, onBack }) {
  const [tratamiento, setTratamiento] = useState(TRATAMIENTO_INICIAL);
  const parrafo = construirParrafo(tratamiento);
  const fecha = new Date();

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <BarraCertificado onBack={onBack}>
        <OpcionCertificado
          etiqueta="En el texto decir"
          valor={tratamiento}
          opciones={OPCIONES_TRATAMIENTO}
          onCambiar={setTratamiento}
        />
        {opciones}
      </BarraCertificado>

      <DocumentoImprimible
        tipo="reporte_estudiante"
        className="di-documento--certificado"
        firmas={(branding) => [datosInstitucionalesCertificado(branding).firma]}
      >
        {(branding) => {
          const { encabezado, ciudad } = datosInstitucionalesCertificado(branding);
          return (
            <section className="space-y-6 text-sm leading-8 text-slate-800">
              {encabezado && (
                <p className="whitespace-pre-line text-center font-bold">{encabezado}</p>
              )}
              <p className="text-center text-base font-bold tracking-[0.3em]">CERTIFICA:</p>
              <p className="text-justify">
                {parrafo.map((parte, indice) => (parte.negrita
                  ? <strong key={indice}>{parte.texto}</strong>
                  : <span key={indice}>{parte.texto}</span>))}
              </p>
              <p className="text-justify">{fraseExpedicion({ ciudad, fecha })}</p>
              <p>Atentamente,</p>
            </section>
          );
        }}
      </DocumentoImprimible>
    </div>
  );
}
