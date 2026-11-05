import { parrafoCertificado } from "../../utils/certificadosImpresion/certificadosFormales";
import CertificadoFormal from "./CertificadoFormal";

// "cursó y aprobó": lo decide el admin al imprimir; el sistema no revisa las
// notas finales.
export default function CertificadoAprobadoPreview({ certificado, onBack }) {
  return (
    <CertificadoFormal
      onBack={onBack}
      construirParrafo={(tratamiento) =>
        parrafoCertificado({ tipo: "aprobado", certificado, tratamiento })}
    />
  );
}
