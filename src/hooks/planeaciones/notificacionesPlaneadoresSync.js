import { EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES } from "../../utils/planeaciones/notificacionesContratos";

export function actualizarNotificacionesPlaneadores() {
  window.dispatchEvent(
    new CustomEvent(EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES),
  );
}
