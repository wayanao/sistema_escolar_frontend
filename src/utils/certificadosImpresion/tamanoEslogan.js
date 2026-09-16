export const LIMITES_TAMANO_ESLOGAN = { min: 10, max: 24, paso: 0.1 };

export function obtenerTamanoEslogan(config = {}) {
  const valor = Number(config.tamano_eslogan);
  if (!Number.isFinite(valor) || valor <= 0) {
    return Number(((Number(config.tamano_fuente_base) || 12) * 0.95).toFixed(1));
  }

  return Math.min(
    LIMITES_TAMANO_ESLOGAN.max,
    Math.max(LIMITES_TAMANO_ESLOGAN.min, valor),
  );
}
