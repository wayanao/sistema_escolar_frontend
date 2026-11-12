import CampoPesos from "../CampoPesos";
import useCostosCertificado from "../../hooks/certificadosImpresion/useCostosCertificado";
import {
  parrafoCertificado,
  textoCosto,
} from "../../utils/certificadosImpresion/certificadosFormales";
import CertificadoFormal from "./CertificadoFormal";

const CLASE_CAMPO = "rounded border border-dashed border-slate-400 bg-purple-50/50 px-2 py-0.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100";

// Los costos se editan sobre la misma hoja, donde se imprimen (pedido del
// usuario): en pantalla son campos; en el papel, el texto ("Matrícula:
// $ 280.000"). Lo editado es solo para esta impresión.
export default function CertificadoCostosPreview({ certificado, firmaRector, onBack }) {
  const { costos, agregarCosto, cambiarCosto, quitarCosto } = useCostosCertificado(
    certificado.costos,
  );
  const hayCostosImpresos = costos.some((costo) => textoCosto(costo));

  const listaCostos = (
    <div className={hayCostosImpresos ? "" : "print:hidden"}>
      <p>Con los siguientes costos educativos:</p>
      <ul className="list-disc space-y-1 pl-8">
        {costos.map((costo, indice) => {
          const numero = indice + 1;
          const impreso = textoCosto(costo);
          return (
            <li key={costo.id} className={impreso ? "" : "print:hidden"}>
              <span className="hidden print:inline">{impreso}</span>
              <span className="inline-flex flex-wrap items-center gap-2 print:hidden">
                <input
                  type="text"
                  aria-label={`Concepto ${numero}`}
                  value={costo.concepto}
                  onChange={(event) => cambiarCosto(costo.id, "concepto", event.target.value)}
                  placeholder="Concepto"
                  className={`${CLASE_CAMPO} w-44`}
                />
                <span>: $</span>
                <CampoPesos
                  aria-label={`Valor ${numero}`}
                  valor={costo.valor}
                  onCambiar={(valor) => cambiarCosto(costo.id, "valor", valor)}
                  placeholder="0"
                  className={`${CLASE_CAMPO} w-28 text-right`}
                />
                <button
                  type="button"
                  onClick={() => quitarCosto(costo.id)}
                  aria-label={`Quitar costo ${numero}`}
                  title="Quitar"
                  className="rounded-full px-2 text-base font-bold leading-none text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={agregarCosto}
        className="mt-2 rounded-lg border border-dashed border-purple-300 px-3 py-1 text-xs font-bold text-purple-700 transition hover:bg-purple-50 print:hidden"
      >
        + Agregar costo
      </button>
    </div>
  );

  return (
    <CertificadoFormal
      firmaRector={firmaRector}
      onBack={onBack}
      opciones={(
        <p className="max-w-xs pb-2 text-xs text-slate-600">
          Los costos se cambian sobre la hoja. Es solo para esta impresión: no
          cambia los precios de Tipos de pago.
        </p>
      )}
      construirParrafo={(tratamiento) =>
        parrafoCertificado({ tipo: "costos", certificado, tratamiento })}
      despuesDelParrafo={listaCostos}
    />
  );
}
