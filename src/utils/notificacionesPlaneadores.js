export const EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES =
  "planeadores:notificaciones-actualizar";

export function actualizarNotificacionesPlaneadores() {
  window.dispatchEvent(
    new CustomEvent(EVENTO_ACTUALIZAR_NOTIFICACIONES_PLANEADORES),
  );
}
