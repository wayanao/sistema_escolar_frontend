import {
  ESTADOS_REVISION_PROFESOR,
  obtenerEstadoRevisionVisual,
} from "../../../utils/planeaciones/profesor";

export default function EstadoRevisionBadge({
  estado,
  totalObservaciones = 0,
  compact = false,
}) {
  const estadoVisual = obtenerEstadoRevisionVisual(
    estado,
    totalObservaciones,
  );
  const config = ESTADOS_REVISION_PROFESOR[estadoVisual];

  return (
    <span
      className={`inline-flex rounded-full border font-black ${config.badgeClass} ${
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      {config.label}
    </span>
  );
}
