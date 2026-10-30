import { textoSelloFirma } from "../../utils/observador/firma";

/**
 * El sello de una anotación firmada por el acudiente: quién firmó, con qué
 * documento -enmascarado-, cuándo y ante quién. Ver
 * `docs/funcionalidades/FIRMA_OBSERVADOR.md`.
 *
 * Si el servidor dice `integra: false`, el texto de la anotación ya no es el
 * que se firmó -alguien lo cambió en la base, sin pasar por la aplicación- y el
 * sello lo advierte en rojo en vez de dar la firma por buena.
 *
 * Presentacional: sin hooks propios y sin HTTP. Sin firma no pinta nada.
 */
export default function SelloFirma({ firma }) {
  const alterada = firma?.integra === false;

  return firma ? (
    <p
      className={`mt-2 rounded-md border px-2 py-1 text-xs ${
        alterada
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span aria-hidden="true">{alterada ? "⚠️ " : "✍️ "}</span>
      {textoSelloFirma(firma)}
      {alterada && (
        <span className="mt-0.5 block font-semibold">
          El texto ya no coincide con lo que se firmó. Avisa al administrador.
        </span>
      )}
    </p>
  ) : null;
}
