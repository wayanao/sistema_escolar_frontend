import { parrafoCertificado } from "../../utils/certificadosImpresion/certificadosFormales";
import CertificadoFormal from "./CertificadoFormal";

// Solo se abre si el estudiante no debe nada a la fecha: lo revisa
// `useConsultasCertificadosAdmin` antes (si debe, sale AvisoDeudaPazSalvo).
export default function CertificadoPazSalvoPreview({ certificado, firmaRector, onBack }) {
  return (
    <CertificadoFormal
      firmaRector={firmaRector}
      onBack={onBack}
      construirParrafo={(tratamiento) =>
        parrafoCertificado({ tipo: "paz-salvo", certificado, tratamiento })}
    />
  );
}
