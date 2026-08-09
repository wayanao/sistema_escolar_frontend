import { describe, expect, it, vi } from "vitest";
import {
  EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES,
  actualizarNotificacionesPlaneadores,
} from "./notificaciones";

describe("notificaciones de planeadores", () => {
  it("conserva el contrato del evento local de actualización", () => {
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
