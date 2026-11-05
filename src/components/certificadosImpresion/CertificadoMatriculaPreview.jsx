import { parrafoCertificado } from "../../utils/certificadosImpresion/certificadosFormales";
import CertificadoFormal from "./CertificadoFormal";

// Con el formato de los modelos del colegio desde el 2026-11-05 (antes, un
// recuadro con documento, curso, jornada y estado, y un texto general).
export default function CertificadoMatriculaPreview({ certificado, onBack }) {
  return (
    <CertificadoFormal
      onBack={onBack}
      construirParrafo={(tratamiento) =>
        parrafoCertificado({ tipo: "matricula", certificado, tratamiento })}
    />
  );
}
