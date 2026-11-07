import { useState } from "react";
import Swal from "sweetalert2";
import { iniciarSesion as solicitarInicioSesion } from "../../services/autenticacionApi";
import {
  CLAVE_ULTIMO_CODIGO_COLEGIO,
  capitalizarNombreVisible,
  construirPayloadLogin,
  estanCompletasLasCredenciales,
  normalizarCodigoColegio,
  normalizarCodigoColegioRecordado,
  obtenerRutaDespuesDeLogin,
} from "../../utils/autenticacion/login";
import {
  construirSesionVisual,
  obtenerClaveIdentidadPorRol,
  obtenerClavesIdentidadAlternas,
} from "../../utils/autenticacion/sesion";
import { mostrarExito } from "../ventanaExito";

function leerUltimoCodigoColegio() {
  return normalizarCodigoColegioRecordado(
    localStorage.getItem(CLAVE_ULTIMO_CODIGO_COLEGIO),
  );
}

export function useComandoLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigoColegio, setCodigoColegio] = useState(leerUltimoCodigoColegio);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [loginSucceeded, setLoginSucceeded] = useState(false);

  const limpiarError = () => {
    if (formError) setFormError("");
  };

  const actualizarEmail = (valor) => {
    setEmail(valor);
    limpiarError();
  };

  const actualizarPassword = (valor) => {
    setPassword(valor);
    limpiarError();
  };

  const actualizarCodigoColegio = (valor) => {
    setCodigoColegio(valor.toLowerCase());
    limpiarError();
  };

  const iniciarSesion = async () => {
    if (isSubmitting) return;

    const codigoNormalizado = normalizarCodigoColegio(codigoColegio);

    if (!estanCompletasLasCredenciales({ email, password, codigoColegio: codigoNormalizado })) {
      setFormError("Completa el código del colegio, el correo y la contraseña.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    setIsTakingLong(false);
    setLoginSucceeded(false);
    let accesoConfirmado = false;
    const slowRequestTimer = window.setTimeout(() => {
      setIsTakingLong(true);
    }, 3000);

    try {
      const data = await solicitarInicioSesion(construirPayloadLogin({
        email,
        password,
        codigoColegio: codigoNormalizado,
      }));

      localStorage.setItem(CLAVE_ULTIMO_CODIGO_COLEGIO, codigoNormalizado);

      const sessionData = construirSesionVisual(data);
      const claveSesion = obtenerClaveIdentidadPorRol(data.rol);
      localStorage.setItem(claveSesion, JSON.stringify(sessionData));
      obtenerClavesIdentidadAlternas(data.rol).forEach((clave) => {
        localStorage.removeItem(clave);
      });

      accesoConfirmado = true;
      setLoginSucceeded(true);
      setIsTakingLong(false);

      await mostrarExito({
        title: "¡Éxito!",
        text: `Bienvenido ${capitalizarNombreVisible(data.nombre)}`,
        timer: 1000,
      });

      window.location.href = obtenerRutaDespuesDeLogin(data);
    } catch (error) {
      if (error.response?.status === 401) {
        Swal.fire({ icon: "error", title: "Acceso no válido", text: "Revisa tus credenciales e intenta nuevamente." });
      } else if (error.response?.status === 403) {
        const detail = error.response.data?.detail;
        const message = typeof detail === "object" ? detail.message : detail;
        Swal.fire({
          icon: "warning",
          title: "Servicio no disponible",
          text: message || "El servicio del colegio no se encuentra habilitado.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "No pudimos conectar",
          text: "Comprueba tu conexión e intenta nuevamente.",
        });
      }
    } finally {
      window.clearTimeout(slowRequestTimer);
      if (!accesoConfirmado) {
        setIsSubmitting(false);
        setIsTakingLong(false);
      }
    }
  };

  return {
    email,
    password,
    codigoColegio,
    formError,
    isSubmitting,
    isTakingLong,
    loginSucceeded,
    actualizarEmail,
    actualizarPassword,
    actualizarCodigoColegio,
    iniciarSesion,
  };
}
