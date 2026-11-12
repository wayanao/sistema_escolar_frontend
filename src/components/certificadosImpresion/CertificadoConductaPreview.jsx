import { useState } from "react";

import {
  DESEMPENOS_CONDUCTA,
  parrafoCertificado,
} from "../../utils/certificadosImpresion/certificadosFormales";
import CertificadoFormal, { OpcionCertificado } from "./CertificadoFormal";

const OPCIONES_DESEMPENO = [
  { value: "", label: "Elegir…" },
  ...DESEMPENOS_CONDUCTA.map((desempeno) => ({
    value: desempeno,
    label: desempeno.charAt(0) + desempeno.slice(1).toLocaleLowerCase("es-CO"),
  })),
];

// El sistema no guarda la conducta: se elige al imprimir. Sin elegir, el
// desempeño sale en una raya, para llenarlo a mano.
export default function CertificadoConductaPreview({ certificado, firmaRector, onBack }) {
  const [desempeno, setDesempeno] = useState("");

  return (
    <CertificadoFormal
      firmaRector={firmaRector}
      onBack={onBack}
      opciones={(
        <OpcionCertificado
          etiqueta="Desempeño"
          valor={desempeno}
          opciones={OPCIONES_DESEMPENO}
          onCambiar={setDesempeno}
        />
      )}
      construirParrafo={(tratamiento) =>
        parrafoCertificado({ tipo: "conducta", certificado, tratamiento, desempeno })}
    />
  );
}
