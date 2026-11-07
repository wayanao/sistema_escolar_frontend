import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { cambiarPassword } from "../../services/autenticacionApi";
import {
  TIPO_ERROR_CAMBIO_PASSWORD,
  construirPayloadCambioPassword,
  validarCambioPassword,
} from "../../utils/autenticacion/password";
import {
  CLAVES_SESION,
  RUTAS_SESION,
  marcarPasswordComoCambiada,
  parsearSesionAlmacenada,
} from "../../utils/autenticacion/sesion";
import { mostrarExito } from "../ventanaExito";

export function useCambiarPassword() {
  const navigate = useNavigate();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [saving, setSaving] = useState(false);

  const guardar = async (event) => {
    event.preventDefault();

    const validacion = validarCambioPassword({
      passwordActual,
      passwordNueva,
      confirmacion,
    });
    if (validacion?.tipo === TIPO_ERROR_CAMBIO_PASSWORD.DEBIL) {
      Swal.fire({
        icon: "warning",
        title: "Password debil",
        text: `La nueva password debe incluir ${validacion.requisitos.join(", ")}.`,
      });
      return;
    }
    if (validacion?.tipo === TIPO_ERROR_CAMBIO_PASSWORD.CONFIRMACION) {
      Swal.fire({ icon: "warning", title: "Revisa la confirmacion", text: "Las passwords no coinciden." });
      return;
    }
    if (validacion?.tipo === TIPO_ERROR_CAMBIO_PASSWORD.REUTILIZADA) {
      Swal.fire({ icon: "warning", title: "Usa una password nueva", text: "No puede ser igual a la temporal." });
      return;
    }

    setSaving(true);
    try {
      await cambiarPassword(
        construirPayloadCambioPassword({ passwordActual, passwordNueva }),
      );

      const usuario = parsearSesionAlmacenada(localStorage.getItem(CLAVES_SESION.USUARIO));
      const usuarioActualizado = marcarPasswordComoCambiada(usuario);
      if (usuarioActualizado) {
        localStorage.setItem(CLAVES_SESION.USUARIO, JSON.stringify(usuarioActualizado));
      }

      mostrarExito({ title: "Password actualizada" }).then(() =>
        navigate(RUTAS_SESION.INICIO_ADMIN, { replace: true }),
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      Swal.fire({
        icon: "error",
        title: "No se pudo cambiar",
        text: typeof detail === "string" ? detail : "Revisa la password temporal e intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    passwordActual,
    setPasswordActual,
    passwordNueva,
    setPasswordNueva,
    confirmacion,
    setConfirmacion,
    saving,
    guardar,
  };
}
