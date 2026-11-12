import { useId } from "react";

/**
 * «Con la firma del rector(a)»: la casilla de la barra de arriba del
 * certificado (docs/funcionalidades/FIRMAS_BOLETIN.md, paso 5). No sale en el
 * papel. Desmarcada de entrada (decidido con el usuario el 2026-11-12): un
 * certificado que va firmado a mano y con sello simplemente no se marca.
 *
 * `firmaRector` es `{ imagen, cargando, error }` (`useFirmaParaImprimir`).
 * Sin firma guardada, la casilla no se puede marcar y dice dónde subirla.
 */
export default function OpcionFirmaRector({ firmaRector, marcada, onCambiar }) {
  const id = useId();
  const hayFirma = Boolean(firmaRector?.imagen);
  const aviso = firmaRector?.cargando
    ? ""
    : firmaRector?.error
      ? "No se pudo cargar la firma guardada."
      : !hayFirma
        ? "No hay firma guardada. Súbela en Diseño de impresos → Identidad institucional."
        : "";

  return (
    <div className="max-w-xs">
      <span className="mb-1 block text-xs font-semibold text-slate-600">Firma</span>
      <label
        htmlFor={id}
        className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-sm ${
          hayFirma ? "cursor-pointer border-slate-300 text-slate-700" : "border-slate-200 text-slate-400"
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={hayFirma && marcada}
          disabled={!hayFirma}
          onChange={(evento) => onCambiar(evento.target.checked)}
          className="h-4 w-4 accent-purple-600"
        />
        Con la firma del rector(a)
      </label>
      {aviso && <p className="mt-1 text-xs text-slate-500">{aviso}</p>}
    </div>
  );
}
