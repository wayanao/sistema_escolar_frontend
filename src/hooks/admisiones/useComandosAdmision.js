import { useCallback, useEffect, useRef, useState } from "react";
import {
  actualizarAdmision,
  borrarAdmision,
  cambiarResultadoAdmision,
  obtenerAdmision,
  registrarAdmision,
} from "../../services/admisionesApi";
import { etiquetaResultado, mensajeDeErrorAdmision } from "../../utils/admisiones/admisiones";
import {
  construirCuerpoAdmision,
  construirCuerpoAspirante,
  construirCuerpoResultado,
  crearFormularioAdmision,
  formularioDesdeAdmision,
  resultadoDesdeAdmision,
  validarAspirante,
  validarResultado,
} from "../../utils/admisiones/formularios";

const nombreDe = ({ nombre, apellido }) =>
  [nombre, apellido].filter(Boolean).join(" ").trim();

const sinError = (errores, campo) => {
  if (!(campo in errores)) return errores;
  const siguientes = { ...errores };
  delete siguientes[campo];
  return siguientes;
};

// Hook de comando de admisiones: lo que se edita y cada escritura. Ver
// docs/funcionalidades/ENTREVISTA_ADMISION.md.
//
// `modo` es lo que está abierto: `null` (nada), "nuevo" (registrar un
// aspirante) o "ficha" (un aspirante: datos, entrevista y resultado). Al
// registrar se pasa directo a su ficha, para seguir con la entrevista.
//
// Cada comando devuelve `{ estado }`: "exito", "validacion" (no se llamó al
// backend) o "error" (el backend lo rechazó; su mensaje queda en `error`).
// Las reglas las decide el backend; aquí solo se evita mandar lo que él
// rechazaría seguro.
export default function useComandosAdmision({ anioLectivoId, recargar }) {
  const [modo, setModo] = useState(null);
  const [admision, setAdmision] = useState(null);
  const [formulario, setFormulario] = useState(crearFormularioAdmision);
  const [errores, setErrores] = useState({});
  const [resultado, setResultado] = useState(() => resultadoDesdeAdmision(null));
  const [erroresResultado, setErroresResultado] = useState({});
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardandoResultado, setGuardandoResultado] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const fichaRef = useRef(null);

  const mostrarAdmision = useCallback((detalle) => {
    setAdmision(detalle);
    setFormulario(formularioDesdeAdmision(detalle));
    setResultado(resultadoDesdeAdmision(detalle));
    setErrores({});
    setErroresResultado({});
  }, []);

  const limpiarAvisos = () => {
    setMensaje("");
    setError("");
  };

  const cerrar = useCallback(() => {
    fichaRef.current?.abort();
    fichaRef.current = null;
    setModo(null);
    setAdmision(null);
    setFormulario(crearFormularioAdmision());
    setErrores({});
    setErroresResultado({});
    setCargandoFicha(false);
  }, []);

  // Otro año: lo que estaba abierto era del anterior.
  useEffect(() => {
    cerrar();
  }, [anioLectivoId, cerrar]);

  const abrirNuevo = useCallback(() => {
    cerrar();
    limpiarAvisos();
    setModo("nuevo");
  }, [cerrar]);

  const abrirFicha = useCallback(
    async (admisionId) => {
      cerrar();
      limpiarAvisos();
      const controller = new AbortController();
      fichaRef.current = controller;
      setModo("ficha");
      setCargandoFicha(true);
      try {
        const detalle = await obtenerAdmision(admisionId, { signal: controller.signal });
        if (controller.signal.aborted || fichaRef.current !== controller) return;
        mostrarAdmision(detalle);
      } catch (fallo) {
        if (controller.signal.aborted || fichaRef.current !== controller) return;
        setModo(null);
        setError(mensajeDeErrorAdmision(fallo, "No se pudo abrir la admisión."));
      } finally {
        if (fichaRef.current === controller) {
          fichaRef.current = null;
          setCargandoFicha(false);
        }
      }
    },
    [cerrar, mostrarAdmision],
  );

  const cambiarCampo = useCallback((campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
    setErrores((actuales) => sinError(actuales, campo));
  }, []);

  const cambiarResultado = useCallback((campo, valor) => {
    setResultado((actual) => ({ ...actual, [campo]: valor }));
    setErroresResultado((actuales) => sinError(actuales, campo));
  }, []);

  const registrar = async () => {
    limpiarAvisos();
    const encontrados = validarAspirante(formulario);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return { estado: "validacion" };

    setGuardando(true);
    try {
      const detalle = await registrarAdmision(anioLectivoId, construirCuerpoAspirante(formulario));
      setModo("ficha");
      mostrarAdmision(detalle);
      setMensaje(
        `Se registró a ${nombreDe(detalle)} como aspirante. Ahora puedes escribir la entrevista.`,
      );
      void recargar();
      return { estado: "exito" };
    } catch (fallo) {
      setError(mensajeDeErrorAdmision(fallo, "No se pudo registrar al aspirante."));
      return { estado: "error" };
    } finally {
      setGuardando(false);
    }
  };

  const guardarFicha = async () => {
    if (!admision) return { estado: "validacion" };
    limpiarAvisos();
    const encontrados = validarAspirante(formulario);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return { estado: "validacion" };

    setGuardando(true);
    try {
      const detalle = await actualizarAdmision(admision.id, construirCuerpoAdmision(formulario));
      mostrarAdmision(detalle);
      setMensaje(`Se guardaron los datos y la entrevista de ${nombreDe(detalle)}.`);
      void recargar();
      return { estado: "exito" };
    } catch (fallo) {
      setError(mensajeDeErrorAdmision(fallo, "No se pudieron guardar los datos."));
      return { estado: "error" };
    } finally {
      setGuardando(false);
    }
  };

  const guardarResultado = async () => {
    if (!admision) return { estado: "validacion" };
    limpiarAvisos();
    const encontrados = validarResultado(resultado);
    setErroresResultado(encontrados);
    if (Object.keys(encontrados).length > 0) return { estado: "validacion" };

    setGuardandoResultado(true);
    try {
      const detalle = await cambiarResultadoAdmision(
        admision.id,
        construirCuerpoResultado(resultado),
      );
      mostrarAdmision(detalle);
      setMensaje(`Resultado de ${nombreDe(detalle)}: ${etiquetaResultado(detalle.resultado)}.`);
      void recargar();
      return { estado: "exito" };
    } catch (fallo) {
      setError(mensajeDeErrorAdmision(fallo, "No se pudo guardar el resultado."));
      return { estado: "error" };
    } finally {
      setGuardandoResultado(false);
    }
  };

  // Confirmar antes de borrar es trabajo de la pantalla.
  const borrar = async () => {
    if (!admision) return { estado: "validacion" };
    limpiarAvisos();
    const nombre = nombreDe(admision);
    setBorrando(true);
    try {
      await borrarAdmision(admision.id);
      cerrar();
      setMensaje(`Se borró la admisión de ${nombre}.`);
      void recargar();
      return { estado: "exito" };
    } catch (fallo) {
      setError(mensajeDeErrorAdmision(fallo, "No se pudo borrar la admisión."));
      return { estado: "error" };
    } finally {
      setBorrando(false);
    }
  };

  return {
    modo,
    admision,
    formulario,
    errores,
    resultado,
    erroresResultado,
    cargandoFicha,
    guardando,
    guardandoResultado,
    borrando,
    mensaje,
    error,
    abrirNuevo,
    abrirFicha,
    cerrar,
    cambiarCampo,
    cambiarResultado,
    registrar,
    guardarFicha,
    guardarResultado,
    borrar,
  };
}
