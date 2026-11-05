import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { MORADO_BOTON } from "../../constants/colores";
import { guardarPlanProfesor } from "../../services/planeacionesApi";
import { crearFormDataPlanProfesor } from "../../utils/planeaciones/profesor";

export default function useGuardadoPlaneacionProfesor({
  asignacionId,
  periodo,
  fecha,
  form,
  imagenes,
  planActualId,
  versionRevision,
  recordarCampos,
  marcarGuardado,
  recargarPlaneacion,
  onPlanIdActualizado,
  onMensaje,
  onConfirmacionGuardado,
  onSubirInicio,
}) {
  const [guardando, setGuardando] = useState(false);
  const guardarPlanRef = useRef(null);

  const guardarPlan = useCallback(async () => {
    if (!asignacionId || !periodo || !fecha) {
      window.alert("Selecciona la clase, el periodo y la fecha antes de guardar.");
      return;
    }

    const formData = crearFormDataPlanProfesor({
      asignacionId,
      planActualId,
      versionRevision,
      periodo,
      fecha,
      form,
      imagenes,
    });

    setGuardando(true);
    try {
      const planGuardado = await guardarPlanProfesor(formData);
      const guardadoEn = new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const mensajeExito =
        planGuardado.mensaje ||
        "Plan guardado y enviado a administración.";

      recordarCampos();
      onPlanIdActualizado(planGuardado.id);
      marcarGuardado(guardadoEn);
      onMensaje(mensajeExito);
      onSubirInicio();

      Promise.resolve(recargarPlaneacion())
        .then(() => {
          marcarGuardado(guardadoEn);
          onMensaje(mensajeExito);
          onConfirmacionGuardado();
        })
        .catch((reloadError) => {
          console.error(
            "Error recargando plan despues de guardar",
            reloadError,
          );
        });
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        const detail = requestError.response?.data?.detail;
        const conflicto = await Swal.fire({
          icon: "warning",
          title: "Este plan cambió en otra pestaña",
          text:
            detail?.mensaje ||
            "Otra pestaña o dispositivo guardó una versión más reciente. Tus cambios no se sobrescribieron.",
          confirmButtonText: "Cargar versión reciente",
          confirmButtonColor: MORADO_BOTON,
          showCancelButton: true,
          cancelButtonText: "Seguir viendo mis cambios",
          reverseButtons: true,
        });

        if (conflicto.isConfirmed) {
          await recargarPlaneacion();
          onSubirInicio();
        } else {
          onMensaje(
            "Tus cambios siguen visibles, pero todavía no se han guardado.",
          );
        }
        return;
      }

      const esFalloDeConexion =
        !requestError.response &&
        (requestError.code === "ERR_NETWORK" || Boolean(requestError.request));

      if (esFalloDeConexion) {
        const sinInternet = navigator.onLine === false;
        const conexion = await Swal.fire({
          icon: "warning",
          title: sinInternet
            ? "Sin conexión a internet"
            : "No pudimos conectar con el servidor",
          text: sinInternet
            ? "El plan no pudo guardarse. Tus textos e imágenes continúan en pantalla."
            : "Revisa tu conexión e inténtalo nuevamente. Tus cambios no se han perdido.",
          confirmButtonText: "Intentar de nuevo",
          confirmButtonColor: MORADO_BOTON,
          showCancelButton: true,
          cancelButtonText: "Seguir editando",
          reverseButtons: true,
          allowOutsideClick: false,
        });

        if (conexion.isConfirmed) {
          setGuardando(false);
          window.setTimeout(() => {
            void guardarPlanRef.current?.();
          }, 0);
        } else {
          onMensaje(
            "El plan sigue sin guardar. Tus cambios continúan en pantalla.",
          );
        }
        return;
      }

      console.error("Error guardando plan", requestError);
      void Swal.fire(
        "Error",
        requestError.response?.data?.detail || "Error al guardar",
        "error",
      );
    } finally {
      setGuardando(false);
    }
  }, [
    asignacionId,
    fecha,
    form,
    imagenes,
    marcarGuardado,
    onConfirmacionGuardado,
    onMensaje,
    onPlanIdActualizado,
    onSubirInicio,
    periodo,
    planActualId,
    recargarPlaneacion,
    recordarCampos,
    versionRevision,
  ]);

  useEffect(() => {
    guardarPlanRef.current = guardarPlan;
  }, [guardarPlan]);

  return {
    guardando,
    guardarPlan,
  };
}
