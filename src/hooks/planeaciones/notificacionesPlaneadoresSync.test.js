import { describe, expect, it, vi } from "vitest";
import { EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES } from "../../utils/planeaciones/notificacionesContratos";
import { actualizarNotificacionesPlaneadores } from "./notificacionesPlaneadoresSync";

describe("sincronización de notificaciones de planeadores", () => {
  it("despacha el evento local conservando su contrato", () => {
    const listener = vi.fn();
    window.addEventListener(
      EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES,
      listener,
    );

    try {
      actualizarNotificacionesPlaneadores();

      expect(EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES).toBe(
        "planeadores:notificaciones-actualizar",
      );
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
    } finally {
      window.removeEventListener(
        EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES,
        listener,
      );
    }
  });
});
