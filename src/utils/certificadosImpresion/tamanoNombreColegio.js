export const LIMITES_TAMANO_NOMBRE_COLEGIO = { min: 12, max: 48, paso: 0.1 };

export function obtenerTamanoNombreColegio(config = {}) {
  const valor = Number(config.tamano_nombre_colegio);
  if (!Number.isFinite(valor) || valor <= 0) {
    return Number(((Number(config.tamano_fuente_base) || 12) * 1.4).toFixed(1));
  }

  return Math.min(
    LIMITES_TAMANO_NOMBRE_COLEGIO.max,
    Math.max(LIMITES_TAMANO_NOMBRE_COLEGIO.min, valor),
  );
}
