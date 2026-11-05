import { useCallback, useEffect, useRef, useState } from "react";
import {
  actualizarRevisionPlaneacionAdmin,
  crearObservacionPlaneacionAdmin,
  listarObservacionesPlan,
  obtenerPlaneacionAdmin,
} from "../../services/planeacionesApi";
import { primeraMayuscula } from "../../utils/nombres";
import { detalleError } from "../../utils/planeaciones/admin";
import { actualizarNotificacionesPlaneadores } from "./notificacionesPlaneadoresSync";
import useEliminacionImagenPlaneacionAdmin from "./useEliminacionImagenPlaneacionAdmin";

export default function useDetallePlaneacionAdmin({
  planId,
  onSubirInicio,
}) {
  const [plan, setPlan] = useState(null);
  const [observaciones, setObservaciones] = useState([]);
  const [observacion, setObservacion] = useState("");
  const [cargando, setCargando] = useState(true);
  const [accionRevision, setAccionRevision] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const cargaActualRef = useRef(0);

  const cargarDetalle = useCallback(async () => {
    const cargaId = cargaActualRef.current + 1;
    cargaActualRef.current = cargaId;
    setCargando(true);
    setMensaje(null);

    try {
      const [planData, observacionesData] = await Promise.all([
        obtenerPlaneacionAdmin(planId),
        listarObservacionesPlan(planId),
      ]);
      if (cargaActualRef.current !== cargaId) return;
      setObservaciones(
        Array.isArray(observacionesData) ? observacionesData : [],
      );
      setPlan(planData);
    } catch (requestError) {
      if (cargaActualRef.current !== cargaId) return;
      console.error("Error cargando detalle del planeador", requestError);
      setPlan(null);
      setMensaje({
        tono: "error",
        texto: detalleError(
          requestError,
          "No fue posible abrir esta planeación.",
        ),
      });
    } finally {
      if (cargaActualRef.current === cargaId) setCargando(false);
    }
  }, [planId]);

  useEffect(() => {
    void cargarDetalle();
    return () => {
      cargaActualRef.current += 1;
    };
  }, [cargarDetalle]);

  const manejarConflicto = useCallback(
    async (requestError) => {
      if (requestError.response?.status !== 409) return false;
      const texto = detalleError(
        requestError,
        "El plan cambió. Recargamos la versión más reciente.",
      );
      await cargarDetalle();
      setMensaje({ tono: "aviso", texto });
      return true;
    },
    [cargarDetalle],
  );

  const marcarRevisado = useCallback(async () => {
    // El comentario al profesor va con la primera letra en mayúscula.
    const texto = primeraMayuscula(observacion);
    if (!plan || accionRevision) return;
    const yaEstabaRevisada = plan.estado_revision === "revisado";
    setAccionRevision("aprobar");
    setMensaje(null);

    try {
      const data = await actualizarRevisionPlaneacionAdmin(plan.id, {
        estado: "revisado",
        version: plan.version_revision,
        comentario: texto || null,
      });
      const {
        observacion: observacionGuardada,
        ...revisionActualizada
      } = data;
      const comentarioGuardado = observacionGuardada
        ? { ...observacionGuardada, admin: "Administración" }
        : null;

      if (comentarioGuardado) {
        setObservaciones((actual) => [comentarioGuardado, ...actual]);
      }
      setPlan((actual) => ({
        ...actual,
        ...revisionActualizada,
        total_observaciones:
          Number(actual.total_observaciones || 0) +
          (comentarioGuardado ? 1 : 0),
      }));
      setObservacion("");
      actualizarNotificacionesPlaneadores();
      setMensaje({
        tono: "exito",
        texto:
          yaEstabaRevisada && comentarioGuardado
            ? "El reconocimiento fue enviado al profesor y la planeación continúa revisada."
            : comentarioGuardado
              ? "La planeación quedó revisada y el comentario fue enviado al profesor."
              : "La planeación quedó marcada como revisada.",
      });
      onSubirInicio();
    } catch (requestError) {
      if (!(await manejarConflicto(requestError))) {
        setMensaje({
          tono: "error",
          texto: detalleError(
            requestError,
            "No se pudo marcar la planeación como revisada.",
          ),
        });
      }
    } finally {
      setAccionRevision("");
    }
  }, [
    accionRevision,
    manejarConflicto,
    observacion,
    onSubirInicio,
    plan,
  ]);

  const guardarObservacion = useCallback(async () => {
    const texto = primeraMayuscula(observacion);
    if (!plan || !texto || accionRevision) return;
    setAccionRevision("ajuste");
    setMensaje(null);

    try {
      const data = await crearObservacionPlaneacionAdmin(plan.id, {
        observacion: texto,
        version: plan.version_revision,
      });
      const nueva = { ...data.observacion, admin: "Administración" };
      setObservaciones((actual) => [nueva, ...actual]);
      setPlan((actual) => ({
        ...actual,
        estado_revision: data.estado_revision,
        total_observaciones:
          Number(actual.total_observaciones || 0) + 1,
      }));
      setObservacion("");
      actualizarNotificacionesPlaneadores();
      setMensaje({
        tono: "exito",
        texto: "La solicitud de ajuste fue enviada al profesor.",
      });
      onSubirInicio();
    } catch (requestError) {
      if (!(await manejarConflicto(requestError))) {
        setMensaje({
          tono: "error",
          texto: detalleError(
            requestError,
            "No se pudo enviar la solicitud de ajuste.",
          ),
        });
      }
    } finally {
      setAccionRevision("");
    }
  }, [
    accionRevision,
    manejarConflicto,
    observacion,
    onSubirInicio,
    plan,
  ]);

  const manejarImagenEliminada = useCallback((slot) => {
    setPlan((actual) => (actual ? { ...actual, [slot]: null } : actual));
  }, []);
  const manejarMensajeImagen = useCallback((siguienteMensaje) => {
    setMensaje(siguienteMensaje);
  }, []);
  const { eliminandoImagen, eliminarImagen } =
    useEliminacionImagenPlaneacionAdmin({
      onImagenEliminada: manejarImagenEliminada,
      onMensaje: manejarMensajeImagen,
    });

  return {
    plan,
    observaciones,
    observacion,
    setObservacion,
    cargando,
    accionRevision,
    mensaje,
    marcarRevisado,
    guardarObservacion,
    eliminandoImagen,
    eliminarImagen,
  };
}
