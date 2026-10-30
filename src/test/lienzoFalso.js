import { vi } from "vitest";

/**
 * jsdom no dibuja: su `<canvas>` no tiene contexto 2D y `getContext` devuelve
 * `null`. Para probar el recuadro de firma del observador
 * (`components/observador/RecuadroFirma.jsx`) se cambia por un contexto que
 * acepta los trazos sin pintar nada, y `toDataURL` devuelve siempre
 * `IMAGEN_FALSA`.
 *
 * Quien lo instala lo deshace con `vi.restoreAllMocks()`.
 */

// Un PNG real de 1x1, para que lo enviado parezca lo que manda el navegador.
export const IMAGEN_FALSA =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export function instalarLienzoFalso() {
  const contexto = {
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(contexto);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(IMAGEN_FALSA);
  return contexto;
}
