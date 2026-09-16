export const LIMITES_TAMANO_ESCUDO = { min: 40, max: 160, paso: 5 };

export function obtenerTamanoEscudo(config = {}) {
  const valor = Number(config.tamano_escudo);
  if (!Number.isFinite(valor) || valor <= 0) {
    return config.posicion_logo === "centro" ? 80 : 70;
  }

  return Math.min(
    LIMITES_TAMANO_ESCUDO.max,
    Math.max(LIMITES_TAMANO_ESCUDO.min, Math.round(valor)),
  );
}
